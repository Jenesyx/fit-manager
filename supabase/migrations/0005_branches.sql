-- ============================================================
-- Fit-Manager — replace the studio network with 5 Niederrhein cities,
-- two Filialen each (= 10 studios), every Filiale identical: 3 rooms
-- with 10 / 20 / 30 Plätze.
--
-- Removing the old rooms sets courses.room_id -> null (FK on delete set
-- null), so no course rows are lost — they simply lose their old room.
-- ============================================================

delete from public.rooms;
delete from public.locations;

insert into public.locations (id, name, city) values
  ('10000000-0000-4000-8000-000000000001', 'Mönchengladbach Zentrum',  'Mönchengladbach'),
  ('10000000-0000-4000-8000-000000000002', 'Mönchengladbach Rheydt',   'Mönchengladbach'),
  ('20000000-0000-4000-8000-000000000001', 'Köln Innenstadt',          'Köln'),
  ('20000000-0000-4000-8000-000000000002', 'Köln Ehrenfeld',           'Köln'),
  ('30000000-0000-4000-8000-000000000001', 'Düsseldorf Altstadt',      'Düsseldorf'),
  ('30000000-0000-4000-8000-000000000002', 'Düsseldorf Bilk',          'Düsseldorf'),
  ('40000000-0000-4000-8000-000000000001', 'Duisburg Mitte',           'Duisburg'),
  ('40000000-0000-4000-8000-000000000002', 'Duisburg Hamborn',         'Duisburg'),
  ('50000000-0000-4000-8000-000000000001', 'Krefeld Zentrum',          'Krefeld'),
  ('50000000-0000-4000-8000-000000000002', 'Krefeld Uerdingen',        'Krefeld');

insert into public.rooms (location_id, name, capacity)
select l.id, r.name, r.capacity
from public.locations l
cross join (values
  ('Studio Klein',  10),
  ('Studio Mittel', 20),
  ('Studio Groß',   30)
) as r(name, capacity);
