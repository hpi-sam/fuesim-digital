import pandas as pd
import pm4py

from pandas import DataFrame
from flask import Flask, jsonify
from flask import request
app = Flask(__name__)

@app.post("/process")
def do_process_mining():
    if not request.is_json:
        return "No data submitted", 400

    dataframe = DataFrame.from_dict(request.json)
    dataframe = pm4py.format_dataframe(dataframe, case_id='case:concept:name', activity_key='concept:name', timestamp_key='time:timestamp')
    event_log = pm4py.convert_to_event_log(dataframe)
    dfg, sa, ea = pm4py.discover_directly_follows_graph(event_log)

    data = {
        "dfg": [ {"activities": activities, "count": count} for activities, count in dfg.items()],
        "start_activities": sa,
        "end_activities": ea
    }
    print(data)
    return jsonify(data), 200



if __name__ == "__main__":
    app.run("127.0.0.1", 4202)
