import json
import time
from datetime import datetime, timezone
from agent.match_context import get_match_context
from agent.match_search import get_match_result

try:
    from utils import is_gemini_quota_error
except ImportError:
    try:
        from backend.utils import is_gemini_quota_error
    except ImportError:
        def is_gemini_quota_error(e):
            err_str = str(e)
            return "RESOURCE_EXHAUSTED" in err_str or "429" in err_str


def run_stage(fn):
    """
    Runs a single sync stage, timing it and handling errors uniformly.
    Returns (result, duration, error_message, is_quota_err, failed).
    """
    t0 = time.perf_counter()

    try:
        result = fn()
        duration = time.perf_counter() - t0

        if isinstance(result, dict) and "error" in result:
            raise Exception(result["error"])

        return result, duration, None, False, False

    except Exception as e:
        duration = time.perf_counter() - t0
        is_quota_err = is_gemini_quota_error(e)
        error_message = "AI resource exhausted" if is_quota_err else str(e)

        return None, duration, error_message, is_quota_err, True


def sync_match_result(tournament_id, match_number, sample_result=None, verbose=False):
    """
    Synchronizes a match result by:
      1. Fetching match context from the database
      2. Using the match context, finding the official result with an LLM and web search
      3. Using the match result, simulates the match

    sample_result: if provided, get_match_result returns this immediately instead of calling the LLM/web search.

    Returns a unified metrics/result dictionary containing status, failed_stage (if any),
    timing across all stages, context summary, fetched result, and error details.
    """

    total_start = time.perf_counter()

    if verbose:
        print("-" * 100)
        print(f"MATCH SYNC - tournament={tournament_id} match={match_number}")
        print("-" * 100)

    if verbose:
        print("\n[1/3] CONTEXT")
        print("-" * 100)

    match_context, fetch_context_duration, error_message, is_quota_err, failed = run_stage(
        lambda: get_match_context(tournament_id, match_number)
    )
    failed_stage = "[1/3] CONTEXT" if failed else None

    if verbose:
        print(json.dumps(match_context, indent=2, default=str))

    match_result = None
    resolve_result_duration = None
    simulate_duration = None

    if not failed_stage:
        if verbose:
            print("\n[2/3] RESULT")
            print("-" * 100)

        match_result, resolve_result_duration, error_message, is_quota_err, failed = run_stage(
            lambda: get_match_result(match_context, sample=sample_result)
        )
        if failed:
            failed_stage = "[2/3] RESULT"

        if verbose:
            print(json.dumps(match_result, indent=2, default=str))

    if not failed_stage:
        if verbose:
            print("\n[3/3] SIMULATE")
            print("-" * 100)

        from agent.match_simulate import simulate_match

        result, simulate_duration, error_message, is_quota_err, failed = run_stage(
            lambda: simulate_match(tournament_id, match_number, match_context["format"], match_result)
        )
        if failed:
            failed_stage = "[3/3] SIMULATE"

    total_duration = time.perf_counter() - total_start
    status = "failed" if failed_stage else "success"

    if verbose:
        print("\n" + "-" * 100)
        if status == "success":
            print(f"MATCH SYNC COMPLETE ({total_duration:.2f}s)")
        else:
            print(f"MATCH SYNC FAILED at {failed_stage} ({total_duration:.2f}s)")
        print("-" * 100)

    timing = {
        "fetch_context_seconds": round(fetch_context_duration, 3) if fetch_context_duration is not None else None,
        "resolve_result_seconds": round(resolve_result_duration, 3) if resolve_result_duration is not None else None,
        "simulate_match_seconds": round(simulate_duration, 3) if simulate_duration is not None else None,
        "total_seconds": round(total_duration, 3)
    }

    sync_metrics = {
        "tournamentId": tournament_id,
        "matchNumber": match_number,
        "status": status,
        "failed_stage": failed_stage,
        "error": error_message if failed_stage else None,
        "is_quota_error": is_quota_err if failed_stage else False,
        "context": match_context,
        "result": match_result,
        "timing": timing,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    return sync_metrics