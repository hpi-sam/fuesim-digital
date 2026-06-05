import pm4py
from pm4py import BPMN
from pm4py.util import ml_utils

from pandas import DataFrame
from flask import Flask, jsonify
from flask import request

app = Flask(__name__)


@app.post("/process")
def do_process_mining():
    if not request.is_json:
        return "No data submitted", 400


    dataframe = DataFrame.from_dict(request.json)
    print(dataframe.dtypes)
    dataframe = pm4py.format_dataframe(dataframe, case_id='participantKey', activity_key='name',
                                       timestamp_key='timestamp')
    print(dataframe.dtypes)
    event_log = pm4py.convert_to_event_log(dataframe, return_legacy_log_object=True)


    clusterer = ml_utils.KMeans(n_clusters=6, random_state=0, n_init="auto")
    clusters = []
    for clust_log in pm4py.cluster_log(event_log, sklearn_clusterer=clusterer):
        min_time = -1
        max_time = 0
        bpmn_graph = pm4py.discover_bpmn_inductive(
            clust_log,
        )

        gateways = {}
        activities = {}
        activity_name_to_id_map = {}
        arcs_set = set()
        for node in bpmn_graph.get_nodes():
            if isinstance(node, BPMN.Gateway):
                print(node.id, node.get_in_arcs(), node.get_out_arcs())
                gateways[node.id] = {
                    "id": node.id,
                    "type": node.__class__.__name__,

                }
                arcs_set.update(node.get_in_arcs())
                arcs_set.update(node.get_out_arcs())
            if isinstance(node, BPMN.Task):
                activities[node.id] = {
                    "id": node.id,
                    "name": node.get_name(),
                    "minTime": -1,
                    "maxTime": 0,
                    "occurrences": []
                }
                activity_name_to_id_map[node.get_name()] = node.id
                arcs_set.update(node.get_in_arcs())
                arcs_set.update(node.get_out_arcs())

        participant_keys = [trace[0]["participantKey"] for trace in clust_log]

        arcs = []
        for arc in list(arcs_set):
            print(arc.get_source(), arc.get_target(), type(arc.get_source()), type(arc.get_target()))
            allowed_things = BPMN.Task |  BPMN.Gateway
            if not isinstance(arc.get_source(), allowed_things) or not isinstance(arc.get_target(), allowed_things):
                continue
            arcs.append({
                "source": arc.get_source().id,
                "target": arc.get_target().id
            })
        print(gateways, arcs)

        for trace in clust_log:
            for event in trace:
                name = event["name"]
                time = event["timestamp"].timestamp()
                activity_id = activity_name_to_id_map[name]
                if activities[activity_id]["minTime"] == -1 or time < activities[activity_id]["minTime"] :
                    activities[activity_id]["minTime"] = time
                if min_time == -1 or time < min_time:
                    min_time = time
                if time > activities[activity_id]["maxTime"]:
                    activities[activity_id]["maxTime"] = time
                if time > max_time:
                    max_time = time
                if event["participantKey"] not in activities[activity_id]["occurrences"]:
                    activities[activity_id]["occurrences"].append(event["participantKey"])
        print(activities)

        clusters.append({
            "participantKeys": participant_keys,
            "traces": {trace[0]["participantKey"]: [event._dict for event in trace] for trace in clust_log},
            "activities": activities,
            "gateways": gateways,
            "arcs": arcs,
            "maxTime": max_time,
            "minTime": min_time
        })


    dfg, sa, ea = pm4py.discover_directly_follows_graph(event_log)

    data = {
        "dfg": [{"activities": activities, "count": count} for activities, count in dfg.items()],
        "startActivities": sa,
        "endActivities": ea,
        "clusters": clusters
    }
    # print(data)
    return jsonify(data), 200


if __name__ == "__main__":
    app.run("127.0.0.1", 4202)
