"""Extract the JSON payload from a saved supabase MCP execute_sql result file."""
import json, re, sys
def load(path):
    outer = json.loads(open(path).read())
    text = outer["result"]
    m = re.search(r'\n<untrusted-data-[0-9a-f-]+>\n(.*)\n</untrusted-data-', text, re.S)
    return json.loads(m.group(1))
if __name__ == "__main__":
    print(json.dumps(load(sys.argv[1]))[:500])
