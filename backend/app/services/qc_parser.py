def parse_ace_report(raw):
    assertions = raw.get("assertions", [])

    errors = []
    warnings = []
    passes = []

    for a in assertions:
        result = a.get("result", {})
        outcome = result.get("outcome")
        test = a.get("test", "unknown-rule")
        message = result.get("description", "No description")
        location = a.get("location", "")

        selector = ""
        file = location
        if "#" in location:
            file, selector = location.split("#")

        item = {
            "rule": test,
            "message": message,
            "file": file,
            "selector": f"#{selector}" if selector else ""
        }

        if outcome == "fail":
            errors.append(item)
        elif outcome == "warning":
            warnings.append(item)
        else:
            passes.append(item)

    return {
        "summary": {
            "errors": len(errors),
            "warnings": len(warnings),
            "passes": len(passes)
        },
        "errors": errors,
        "warnings": warnings,
        "passes": passes
    }
