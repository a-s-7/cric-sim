import { Link } from "react-router-dom";

function TournamentErrorPage({ errorCode, message }) {
    const errorColor = errorCode >= 400 && errorCode < 500
        ? "text-rose-700"
        : errorCode >= 500
            ? "text-amber-700"
            : "text-slate-700";
    const supportingMessage = errorCode === 404
        ? "Please check the tournament URL."
        : errorCode >= 500
            ? "Please try again later."
            : "Please try again in a moment.";

    return (
        <main className="flex flex-1 items-center justify-center bg-stone-50 px-6 pb-20 pt-8 font-['Nunito_Sans']">
            <section className="flex w-full max-w-4xl flex-col items-center text-center">
                <svg
                    viewBox="27 4 42 82"
                    fill="currentColor"
                    className={`block h-32 w-auto sm:h-40 lg:h-48 ${errorColor}`}
                >
                    <rect x="29" y="30" width="6" height="54" rx="3" />
                    <rect x="45" y="30" width="6" height="54" rx="3" />
                    <rect x="61" y="30" width="6" height="54" rx="3" />
                    <rect x="32" y="25" width="16" height="4" rx="2" />
                    <rect x="50" y="8" width="16" height="4" rx="2" transform="rotate(-28 58 10)" />
                </svg>
                <p className={`mt-7 text-xl font-semibold lg:text-2xl ${errorColor}`}>
                    {errorCode ?? "Error"}
                </p>
                <h1 className="mt-3 font-['Reem_Kufi'] text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                    {message || "Something went wrong."}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600 lg:text-xl lg:leading-9">
                    {supportingMessage}
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-xl bg-stone-900 px-7 py-3.5 text-base font-medium text-white transition-all duration-150 hover:bg-stone-700 active:scale-[0.97]"
                    >
                        Try again
                    </button>
                    <Link
                        to="/tournaments"
                        className="rounded-xl border border-stone-300 bg-white px-7 py-3.5 text-base font-medium text-stone-800 transition-all duration-150 hover:bg-stone-100 active:scale-[0.97]"
                    >
                        Back to tournaments
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default TournamentErrorPage;
