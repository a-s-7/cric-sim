def overs_to_balls(overs):
    overs_str = str(overs)
    
    if "." in overs_str:
        o, b = overs_str.split(".")
        return int(o) * 6 + int(b)
    else:
        return int(overs) * 6