import pandas as pd
import pm4py
import os
import importlib.util
from pm4py.objects.log.obj import EventLog
from pm4py.objects.process_tree.obj import ProcessTree

if __name__ == "__main__":
    # log = pm4py.read_xes('events.xes')
    # dfg, sa, ea = pm4py.discover_directly_follows_graph(log)
    # pm4py.view_dfg(dfg, sa, ea, format='svg')
    #
    # bpmn_graph = pm4py.discover_bpmn_inductive(
    #     log,
    #     activity_key='concept:name',
    #     case_id_key='case:concept:name',
    #     timestamp_key='time:timestamp'
    # )
    # pm4py.view_bpmn(bpmn_graph, format='svg')




    dataframe: EventLog = pm4py.read_xes("events.xes", return_legacy_log_object=True)

    # define a K-Means with 3 clusters
    from pm4py.util import ml_utils
    clusterer = ml_utils.KMeans(n_clusters=6, random_state=0, n_init="auto")

    for clust_log in pm4py.cluster_log(dataframe, sklearn_clusterer=clusterer):
        print(len(clust_log))
        # process_tree: ProcessTree = pm4py.discover_process_tree_inductive(clust_log)
        #
        # if importlib.util.find_spec("graphviz"):
        #     pm4py.view_process_tree(process_tree)

        bpmn_graph = pm4py.discover_bpmn_inductive(
            clust_log,
        )
        pm4py.view_bpmn(bpmn_graph, format='svg')
