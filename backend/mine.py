import pandas as pd
import pm4py

if __name__ == "__main__":
    log = pm4py.read_xes('events.xes')
    dfg, sa, ea = pm4py.discover_directly_follows_graph(log)
    pm4py.view_dfg(dfg, sa, ea, format='svg')

    bpmn_graph = pm4py.discover_bpmn_inductive(
        log,
        activity_key='concept:name',
        case_id_key='case:concept:name',
        timestamp_key='time:timestamp'
    )
    pm4py.view_bpmn(bpmn_graph, format='svg')
