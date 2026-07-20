
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Claim admin: first user to call becomes admin
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  RETURN public.has_role(auth.uid(), 'admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- Site content
CREATE TABLE public.site_content (
  id int PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site content"
ON public.site_content FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site content"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default content
INSERT INTO public.site_content (id, data) VALUES (1, '{
  "hero": {
    "eyebrow": "Сессионный ударник · Преподаватель",
    "name1": "АРКАДИЙ",
    "name2": "АМЕЛИН",
    "description": "Профессиональный музыкант с 15-летним опытом. Студийные записи, концерты\nс артистами и индивидуальные занятия\nдля тех, кто хочет научиться слышать ритм.",
    "ctaPrimary": "Записаться на сессию",
    "ctaSecondary": "Уроки игры"
  },
  "marquee": ["STUDIO", "LIVE", "TEACHING", "GROOVE", "RECORDING", "TOUR"],
  "about": {
    "eyebrow": "Обо мне",
    "heading": "Ритм — это язык, которому можно научить.",
    "paragraphs": [
      "Меня зовут Аркадий Амелин. Я работаю с артистами в студии и на сцене, записываю барабаны для авторских проектов и саундтреков, преподаю — от первых ударов до сценической свободы.",
      "Окончил консерваторию по классу ударных инструментов. Играл в составах джазовых, рок- и поп-проектов, выступал на крупных российских и международных площадках, участвовал в студийных сессиях для лейблов и независимых артистов."
    ],
    "years": "15+",
    "stats": [
      {"n": "200+", "l": "Концертов"},
      {"n": "80+", "l": "Студ. сессий"},
      {"n": "60+", "l": "Учеников"}
    ]
  },
  "services": {
    "eyebrow": "Услуги",
    "heading": "Три направления — один подход.",
    "subtitle": "Каждый проект — это вкус, точность и звук, под который хочется танцевать, слушать или возвращаться снова.",
    "items": [
      {"n": "01", "t": "Студийные сессии", "d": "Запись барабанов для альбомов, синглов, рекламы и кино. Собственная студия и работа удалённо — отправляю готовые мульти-треки в нужном формате.", "tags": ["Recording", "Online", "Mixing-ready"]},
      {"n": "02", "t": "Концертные выступления", "d": "Поддержка артистов на турах, фестивалях и сольных шоу. Гибко адаптируюсь под жанр: от джаз-стандартов до тяжёлой электроники.", "tags": ["Live", "Tour", "Festival"]},
      {"n": "03", "t": "Преподавание", "d": "Индивидуальные уроки в студии и онлайн. Техника, чтение, импровизация, работа с метрономом и звуком — программа под цели ученика.", "tags": ["Beginner → Pro", "Online", "Russian/English"]}
    ]
  },
  "portfolio": {
    "eyebrow": "Портфолио",
    "heading": "Видеозаписи и клипы.",
    "subtitle": "Примеры живых выступлений, студийных сессий и камерных концертов.",
    "videos": [
      {"title": "Live at Moscow Arena — 2024", "desc": "Концертное выступление с хедлайнером. Полный сет, 32 концерта по туру.", "tags": ["Live", "Tour 2024"], "youtubeUrl": ""},
      {"title": "Студийная сессия «Северный ветер»", "desc": "Запись барабанов для альбома. 11 треков, живое звучание, акустические барабаны.", "tags": ["Studio", "Album"], "youtubeUrl": ""},
      {"title": "Jazz Club Session — Usadba Jazz", "desc": "Камерное выступление в составе квинтета. Импровизация, чтение, groove.", "tags": ["Jazz", "Festival"], "youtubeUrl": ""}
    ]
  },
  "experience": {
    "eyebrow": "Опыт",
    "heading": "Избранные проекты и сцены.",
    "items": [
      {"y": "2024", "t": "Тур с поп-исполнителем", "d": "32 концерта по России и СНГ"},
      {"y": "2023", "t": "Запись альбома «Северный ветер»", "d": "Сессионный ударник, 11 треков"},
      {"y": "2022", "t": "Джаз-фестиваль «Усадьба Jazz»", "d": "Выступление в составе квинтета"},
      {"y": "2021", "t": "Преподавательская практика", "d": "Школа барабанов, 40+ учеников"},
      {"y": "2019", "t": "Саундтрек к короткометражке", "d": "Барабаны, перкуссия, аранжировка"}
    ]
  },
  "contact": {
    "eyebrow": "Контакты",
    "heading": "Давайте сыграем вместе.",
    "description": "Студийная сессия, выступление с вашим коллективом или первый урок — напишите, обсудим формат и сроки.",
    "email": "hello@amelin-drums.ru",
    "phone": "+7 (999) 123-45-67",
    "socials": [
      {"label": "Telegram", "url": "#"},
      {"label": "Instagram", "url": "#"},
      {"label": "YouTube", "url": "#"},
      {"label": "SoundCloud", "url": "#"}
    ]
  }
}'::jsonb);
