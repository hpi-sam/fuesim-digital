-- Custom SQL migration file, put your code below! --
insert into access_key(key) (select "participantKey" as key
                             from exercise_entity
                             union
                             (select "trainerKey" as key from exercise_entity))
on conflict do nothing;
