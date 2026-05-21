import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe = pd.read_json('events.json')
    dataframe = pm4py.format_dataframe(dataframe, case_id='case:concept:name', activity_key='concept:name', timestamp_key='time:timestamp')
    event_log = pm4py.convert_to_event_log(dataframe)
    pm4py.write_xes(event_log, 'events.xes')
