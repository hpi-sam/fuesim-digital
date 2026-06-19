import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe = pd.read_json('events.json')
    dataframe = pm4py.format_dataframe(dataframe, case_id='participantKey', activity_key='name', timestamp_key='timestamp')
    event_log = pm4py.convert_to_event_log(dataframe)
    pm4py.write_xes(event_log, 'events.xes')
