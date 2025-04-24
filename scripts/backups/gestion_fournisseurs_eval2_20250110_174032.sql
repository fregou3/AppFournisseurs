--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS gestion_fournisseurs;
--
-- Name: gestion_fournisseurs; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE gestion_fournisseurs WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE gestion_fournisseurs OWNER TO admin;

\connect gestion_fournisseurs

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: eval2_antecedents_avec_le_tiers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_antecedents_avec_le_tiers (
    id integer NOT NULL,
    reponse character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_antecedents_avec_le_tiers OWNER TO admin;

--
-- Name: eval2_antecedents_avec_le_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_antecedents_avec_le_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_antecedents_avec_le_tiers_id_seq OWNER TO admin;

--
-- Name: eval2_antecedents_avec_le_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_antecedents_avec_le_tiers_id_seq OWNED BY public.eval2_antecedents_avec_le_tiers.id;


--
-- Name: eval2_categorisation_tiers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_categorisation_tiers (
    id integer NOT NULL,
    categorisation character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_categorisation_tiers OWNER TO admin;

--
-- Name: eval2_categorisation_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_categorisation_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_categorisation_tiers_id_seq OWNER TO admin;

--
-- Name: eval2_categorisation_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_categorisation_tiers_id_seq OWNED BY public.eval2_categorisation_tiers.id;


--
-- Name: eval2_criteres_selection; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_criteres_selection (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_criteres_selection OWNER TO admin;

--
-- Name: eval2_criteres_selection_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_criteres_selection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_criteres_selection_id_seq OWNER TO admin;

--
-- Name: eval2_criteres_selection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_criteres_selection_id_seq OWNED BY public.eval2_criteres_selection.id;


--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_duree_envisagee_de_la_relation_contractuelle (
    id integer NOT NULL,
    duree character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_duree_envisagee_de_la_relation_contractuelle OWNER TO admin;

--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_duree_envisagee_de_la_relation_contractuelle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_duree_envisagee_de_la_relation_contractuelle_id_seq OWNER TO admin;

--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_duree_envisagee_de_la_relation_contractuelle_id_seq OWNED BY public.eval2_duree_envisagee_de_la_relation_contractuelle.id;


--
-- Name: eval2_encadrement_relation; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_encadrement_relation (
    id integer NOT NULL,
    encadrement character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_encadrement_relation OWNER TO admin;

--
-- Name: eval2_encadrement_relation_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_encadrement_relation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_encadrement_relation_id_seq OWNER TO admin;

--
-- Name: eval2_encadrement_relation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_encadrement_relation_id_seq OWNED BY public.eval2_encadrement_relation.id;


--
-- Name: eval2_evaluation_risque; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_evaluation_risque (
    id integer NOT NULL,
    risque character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_evaluation_risque OWNER TO admin;

--
-- Name: eval2_evaluation_risque_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_evaluation_risque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_evaluation_risque_id_seq OWNER TO admin;

--
-- Name: eval2_evaluation_risque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_evaluation_risque_id_seq OWNED BY public.eval2_evaluation_risque.id;


--
-- Name: eval2_flux_financier; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_flux_financier (
    id integer NOT NULL,
    montant character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_flux_financier OWNER TO admin;

--
-- Name: eval2_flux_financier_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_flux_financier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_flux_financier_id_seq OWNER TO admin;

--
-- Name: eval2_flux_financier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_flux_financier_id_seq OWNED BY public.eval2_flux_financier.id;


--
-- Name: eval2_interaction_tiers_autre_partie; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_interaction_tiers_autre_partie (
    id integer NOT NULL,
    interaction character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_interaction_tiers_autre_partie OWNER TO admin;

--
-- Name: eval2_interaction_tiers_autre_partie_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_interaction_tiers_autre_partie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_interaction_tiers_autre_partie_id_seq OWNER TO admin;

--
-- Name: eval2_interaction_tiers_autre_partie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_interaction_tiers_autre_partie_id_seq OWNED BY public.eval2_interaction_tiers_autre_partie.id;


--
-- Name: eval2_intervention_autre_partie; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_intervention_autre_partie (
    id integer NOT NULL,
    intervention character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_intervention_autre_partie OWNER TO admin;

--
-- Name: eval2_intervention_autre_partie_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_intervention_autre_partie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_intervention_autre_partie_id_seq OWNER TO admin;

--
-- Name: eval2_intervention_autre_partie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_intervention_autre_partie_id_seq OWNED BY public.eval2_intervention_autre_partie.id;


--
-- Name: eval2_localisation; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_localisation (
    id integer NOT NULL,
    pays character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_localisation OWNER TO admin;

--
-- Name: eval2_localisation_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_localisation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_localisation_id_seq OWNER TO admin;

--
-- Name: eval2_localisation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_localisation_id_seq OWNED BY public.eval2_localisation.id;


--
-- Name: eval2_modalites_de_renouvellement_contrat; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_modalites_de_renouvellement_contrat (
    id integer NOT NULL,
    modalite character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_modalites_de_renouvellement_contrat OWNER TO admin;

--
-- Name: eval2_modalites_de_renouvellement_contrat_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_modalites_de_renouvellement_contrat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_modalites_de_renouvellement_contrat_id_seq OWNER TO admin;

--
-- Name: eval2_modalites_de_renouvellement_contrat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_modalites_de_renouvellement_contrat_id_seq OWNED BY public.eval2_modalites_de_renouvellement_contrat.id;


--
-- Name: eval2_modalites_paiement_reglement; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_modalites_paiement_reglement (
    id integer NOT NULL,
    modalite character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_modalites_paiement_reglement OWNER TO admin;

--
-- Name: eval2_modalites_paiement_reglement_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_modalites_paiement_reglement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_modalites_paiement_reglement_id_seq OWNER TO admin;

--
-- Name: eval2_modalites_paiement_reglement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_modalites_paiement_reglement_id_seq OWNED BY public.eval2_modalites_paiement_reglement.id;


--
-- Name: eval2_nature_tiers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_nature_tiers (
    id integer NOT NULL,
    nature character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_nature_tiers OWNER TO admin;

--
-- Name: eval2_nature_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_nature_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_nature_tiers_id_seq OWNER TO admin;

--
-- Name: eval2_nature_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_nature_tiers_id_seq OWNED BY public.eval2_nature_tiers.id;


--
-- Name: eval2_niveau_dependance_clarins_vs_tiers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_niveau_dependance_clarins_vs_tiers (
    id integer NOT NULL,
    niveau character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_niveau_dependance_clarins_vs_tiers OWNER TO admin;

--
-- Name: eval2_niveau_dependance_clarins_vs_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_niveau_dependance_clarins_vs_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_niveau_dependance_clarins_vs_tiers_id_seq OWNER TO admin;

--
-- Name: eval2_niveau_dependance_clarins_vs_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_niveau_dependance_clarins_vs_tiers_id_seq OWNED BY public.eval2_niveau_dependance_clarins_vs_tiers.id;


--
-- Name: eval2_niveau_dependance_tiers_vs_clarins; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_niveau_dependance_tiers_vs_clarins (
    id integer NOT NULL,
    niveau character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_niveau_dependance_tiers_vs_clarins OWNER TO admin;

--
-- Name: eval2_niveau_dependance_tiers_vs_clarins_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_niveau_dependance_tiers_vs_clarins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_niveau_dependance_tiers_vs_clarins_id_seq OWNER TO admin;

--
-- Name: eval2_niveau_dependance_tiers_vs_clarins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_niveau_dependance_tiers_vs_clarins_id_seq OWNED BY public.eval2_niveau_dependance_tiers_vs_clarins.id;


--
-- Name: eval2_pays_intervention; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_pays_intervention (
    id integer NOT NULL,
    pays character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_pays_intervention OWNER TO admin;

--
-- Name: eval2_pays_intervention_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_pays_intervention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_pays_intervention_id_seq OWNER TO admin;

--
-- Name: eval2_pays_intervention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_pays_intervention_id_seq OWNED BY public.eval2_pays_intervention.id;


--
-- Name: eval2_qualification_tiers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_qualification_tiers (
    id integer NOT NULL,
    qualification character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_qualification_tiers OWNER TO admin;

--
-- Name: eval2_qualification_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_qualification_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_qualification_tiers_id_seq OWNER TO admin;

--
-- Name: eval2_qualification_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_qualification_tiers_id_seq OWNED BY public.eval2_qualification_tiers.id;


--
-- Name: eval2_raisons_relation; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_raisons_relation (
    id integer NOT NULL,
    description text NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_raisons_relation OWNER TO admin;

--
-- Name: eval2_raisons_relation_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_raisons_relation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_raisons_relation_id_seq OWNER TO admin;

--
-- Name: eval2_raisons_relation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_raisons_relation_id_seq OWNED BY public.eval2_raisons_relation.id;


--
-- Name: eval2_region_intervention; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.eval2_region_intervention (
    id integer NOT NULL,
    region character varying(255) NOT NULL,
    poids integer NOT NULL
);


ALTER TABLE public.eval2_region_intervention OWNER TO admin;

--
-- Name: eval2_region_intervention_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.eval2_region_intervention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eval2_region_intervention_id_seq OWNER TO admin;

--
-- Name: eval2_region_intervention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.eval2_region_intervention_id_seq OWNED BY public.eval2_region_intervention.id;


--
-- Name: eval2_antecedents_avec_le_tiers id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_antecedents_avec_le_tiers ALTER COLUMN id SET DEFAULT nextval('public.eval2_antecedents_avec_le_tiers_id_seq'::regclass);


--
-- Name: eval2_categorisation_tiers id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_categorisation_tiers ALTER COLUMN id SET DEFAULT nextval('public.eval2_categorisation_tiers_id_seq'::regclass);


--
-- Name: eval2_criteres_selection id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_criteres_selection ALTER COLUMN id SET DEFAULT nextval('public.eval2_criteres_selection_id_seq'::regclass);


--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_duree_envisagee_de_la_relation_contractuelle ALTER COLUMN id SET DEFAULT nextval('public.eval2_duree_envisagee_de_la_relation_contractuelle_id_seq'::regclass);


--
-- Name: eval2_encadrement_relation id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_encadrement_relation ALTER COLUMN id SET DEFAULT nextval('public.eval2_encadrement_relation_id_seq'::regclass);


--
-- Name: eval2_evaluation_risque id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_evaluation_risque ALTER COLUMN id SET DEFAULT nextval('public.eval2_evaluation_risque_id_seq'::regclass);


--
-- Name: eval2_flux_financier id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_flux_financier ALTER COLUMN id SET DEFAULT nextval('public.eval2_flux_financier_id_seq'::regclass);


--
-- Name: eval2_interaction_tiers_autre_partie id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_interaction_tiers_autre_partie ALTER COLUMN id SET DEFAULT nextval('public.eval2_interaction_tiers_autre_partie_id_seq'::regclass);


--
-- Name: eval2_intervention_autre_partie id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_intervention_autre_partie ALTER COLUMN id SET DEFAULT nextval('public.eval2_intervention_autre_partie_id_seq'::regclass);


--
-- Name: eval2_localisation id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_localisation ALTER COLUMN id SET DEFAULT nextval('public.eval2_localisation_id_seq'::regclass);


--
-- Name: eval2_modalites_de_renouvellement_contrat id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_modalites_de_renouvellement_contrat ALTER COLUMN id SET DEFAULT nextval('public.eval2_modalites_de_renouvellement_contrat_id_seq'::regclass);


--
-- Name: eval2_modalites_paiement_reglement id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_modalites_paiement_reglement ALTER COLUMN id SET DEFAULT nextval('public.eval2_modalites_paiement_reglement_id_seq'::regclass);


--
-- Name: eval2_nature_tiers id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_nature_tiers ALTER COLUMN id SET DEFAULT nextval('public.eval2_nature_tiers_id_seq'::regclass);


--
-- Name: eval2_niveau_dependance_clarins_vs_tiers id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_niveau_dependance_clarins_vs_tiers ALTER COLUMN id SET DEFAULT nextval('public.eval2_niveau_dependance_clarins_vs_tiers_id_seq'::regclass);


--
-- Name: eval2_niveau_dependance_tiers_vs_clarins id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_niveau_dependance_tiers_vs_clarins ALTER COLUMN id SET DEFAULT nextval('public.eval2_niveau_dependance_tiers_vs_clarins_id_seq'::regclass);


--
-- Name: eval2_pays_intervention id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_pays_intervention ALTER COLUMN id SET DEFAULT nextval('public.eval2_pays_intervention_id_seq'::regclass);


--
-- Name: eval2_qualification_tiers id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_qualification_tiers ALTER COLUMN id SET DEFAULT nextval('public.eval2_qualification_tiers_id_seq'::regclass);


--
-- Name: eval2_raisons_relation id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_raisons_relation ALTER COLUMN id SET DEFAULT nextval('public.eval2_raisons_relation_id_seq'::regclass);


--
-- Name: eval2_region_intervention id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_region_intervention ALTER COLUMN id SET DEFAULT nextval('public.eval2_region_intervention_id_seq'::regclass);


--
-- Data for Name: eval2_antecedents_avec_le_tiers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_antecedents_avec_le_tiers (id, reponse, poids) FROM stdin;
1	Oui	0
2	Non	1
\.


--
-- Data for Name: eval2_categorisation_tiers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_categorisation_tiers (id, categorisation, poids) FROM stdin;
1	Personne privée	3
2	Société	0
\.


--
-- Data for Name: eval2_criteres_selection; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_criteres_selection (id, description, poids) FROM stdin;
1	Meilleur prix	0
2	Licence exclusive pour la prestation de services	1
3	Proximité géographique	0
4	Absence d'alternatives raisonnables	1
5	Demandé par l'utilisateur final	1
6	Bonne réputation	0
7	Qualité supérieure du produit/service	0
8	Compétences ou expertise uniques	0
9	Autre	1
10	N/A	0
\.


--
-- Data for Name: eval2_duree_envisagee_de_la_relation_contractuelle; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_duree_envisagee_de_la_relation_contractuelle (id, duree, poids) FROM stdin;
1	Moins de 2 ans	0
2	Entre 2 et 5 ans	1
3	Plus de 5 ans	2
\.


--
-- Data for Name: eval2_encadrement_relation; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_encadrement_relation (id, encadrement, poids) FROM stdin;
1	PO	1
2	Contrat	0
3	N/A	0
\.


--
-- Data for Name: eval2_evaluation_risque; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_evaluation_risque (id, risque, poids) FROM stdin;
1	Adhésion au conseil d'administration	3
2	Ami proche	3
3	Double emploi	3
4	Lien de parenté	3
5	Participation au capital	3
6	Autre	3
7	Aucun conflit d'intérêts potentiel	0
\.


--
-- Data for Name: eval2_flux_financier; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_flux_financier (id, montant, poids) FROM stdin;
1	<100k€	0
2	Entre 100k€ et 1m€	0
3	>1M€	1
\.


--
-- Data for Name: eval2_interaction_tiers_autre_partie; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_interaction_tiers_autre_partie (id, interaction, poids) FROM stdin;
1	Oui	3
2	Non	0
\.


--
-- Data for Name: eval2_intervention_autre_partie; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_intervention_autre_partie (id, intervention, poids) FROM stdin;
1	Imposé	3
2	Identifié par Clarins	0
3	Recommandé	1
\.


--
-- Data for Name: eval2_localisation; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_localisation (id, pays, poids) FROM stdin;
181	Afghanistan	2
182	Albanie	2
183	Algérie	2
184	Angola	2
185	Argentine	2
186	Arménie	1
187	Australie	0
188	Autriche	0
189	Azerbaïdjan	2
190	Bahamas	3
191	Bahreïn	1
192	Bangladesh	2
193	Barbade	3
194	Bélarus	2
195	Belgique	0
196	Bénin	1
197	Bhoutan	0
198	Bolivie	2
199	Bosnie-Herzégovine	2
200	Botswana	1
201	Brésil	2
202	Bulgarie	1
203	Burkina Faso	1
204	Burundi	2
205	Cabo Verde	0
206	Cambodge	2
207	Cameroun	2
208	Canada	0
209	République Centrafricaine	2
210	Tchad	2
211	Chili	0
212	Chine	1
213	Colombie	1
214	Comores	2
215	Congo	2
216	Costa Rica	1
217	Côte d'Ivoire	1
218	Croatie	1
219	Cuba	1
220	Chypre	3
221	Tchécoslovaquie	1
222	République démocratique du Congo	2
223	Danemark	0
224	Djibouti	2
225	Dominique	1
226	République Dominicaine	2
227	Équateur	2
228	Égypte	2
229	El Salvador	2
230	Guinée équatoriale	3
231	Erythrée	2
232	Estonie	0
233	Eswatini	2
234	Éthiopie	2
235	Fidji	1
236	Finlande	0
237	France	0
238	Gabon	2
239	Gambie	2
240	Géorgie	1
241	Allemagne	0
242	Ghana	1
243	Grèce	1
244	Grenade	3
245	Guatemala	2
246	Guinée	2
247	Guinée Bissau	2
248	Guyana	1
249	Haïti	3
250	Honduras	2
251	Hong Kong	0
252	Hongrie	1
253	Islande	0
254	Inde	2
255	Indonésie	2
256	Iran	2
257	Irak	2
258	Irlande	0
259	Israël	0
260	Italie	1
261	Jamaïque	1
262	Japon	0
263	Jordanie	1
264	Kazakhstan	2
265	Kenya	2
266	Corée, Nord	3
267	Corée, Sud	0
268	Kosovo	1
269	Koweït	1
270	Kirghizistan	2
271	Laos	2
272	Lettonie	0
273	Liban	2
274	Lesotho	2
275	Liberia	2
276	Libye	3
277	Lituanie	0
278	Luxembourg	0
279	Madagascar	2
280	Malawi	2
281	Malaisie	1
282	Maldives	2
283	Mali	2
284	Malte	1
285	Mauritanie	2
286	Maurice	3
287	Mexique	2
288	Moldavie	1
289	Mongolie	2
290	Monténégro	1
291	Maroc	2
292	Mozambique	2
293	Myanmar	2
294	Namibie	1
295	Népal	2
296	Pays-Bas	0
297	Nouvelle-Zélande	0
298	Nicaragua	3
299	Niger	2
300	Nigeria	2
301	Macédoine du Nord	1
302	Norvège	1
303	Oman	1
304	Pakistan	2
305	Panama	2
306	Papouasie-Nouvelle-Guinée	2
307	Paraguay	2
308	Pérou	2
309	Philippines	2
310	Pologne	1
311	Portugal	0
312	Qatar	1
313	Roumanie	1
314	Russie	3
315	Rwanda	1
316	Sainte-Lucie	1
317	Saint Vincent et les Grenadines	0
318	Sao Tomé et Principe	1
319	Arabie Saoudite	1
320	Sénégal	1
321	Serbie	2
322	Seychelles	0
323	Sierra Leone	2
324	Singapour	0
325	Slovaquie	1
326	Slovénie	1
327	Salomon (Îles)	1
328	Somalie	3
329	Afrique du Sud	1
330	Sud-Soudan	3
331	Espagne	0
332	Sri Lanka	2
333	Soudan	2
334	Suriname	1
335	Suède	0
336	Suisse	0
337	Syrie	3
338	Taïwan	0
339	Tadjikistan	2
340	Tanzanie	1
341	Thaïlande	2
342	Timor-Leste	1
343	Togo	2
344	Trinité-et-Tobago	1
345	Tunisie	1
346	Turquie	2
347	Turkménistan	3
348	Ouganda	2
349	Ukraine	2
350	Emirats Arabes Unis	0
351	Royaume-Uni	0
352	Etats-Unis d'Amérique	0
353	Uruguay	0
354	Ouzbékistan	2
355	Vanuatu	1
356	Venezuela	3
357	Vietnam	1
358	Yémen	3
359	Zambie	2
360	Zimbabwe	2
\.


--
-- Data for Name: eval2_modalites_de_renouvellement_contrat; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_modalites_de_renouvellement_contrat (id, modalite, poids) FROM stdin;
1	Tacite	1
2	Expresse	0
3	N/A	0
\.


--
-- Data for Name: eval2_modalites_paiement_reglement; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_modalites_paiement_reglement (id, modalite, poids) FROM stdin;
1	Virement	0
2	Chèque	1
3	Espèces	3
4	N/A	0
\.


--
-- Data for Name: eval2_nature_tiers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_nature_tiers (id, nature, poids) FROM stdin;
1	Cible de croissance externe	10
2	Client - Wholesalers	10
3	Client - Retailers	5
4	Client - Department stores	5
5	Four. / Presta. - Baux et loyers	5
6	Four. / Presta. - Communication et média	5
7	Four. / Presta. - Conseils juridiques, stratégiques	5
8	Four. / Presta. - Électricité et gaz	1
9	Four. / Presta. - Equipement de sécurité	3
10	Four. / Presta. - Fourniture de matériel de production	5
11	Four. / Presta. - Fourniture de packaging	5
12	Four. / Presta. - Fourniture de matières premières	5
13	Four. / Presta. - Hébergement	1
14	Four. / Presta. - Immobilier	5
15	Four. / Presta. - Influenceurs	5
16	Four. / Presta. - Installations et équipements	3
17	Four. / Presta. - Intérimaires	5
18	Four. / Presta. - Logistique	5
19	Four. / Presta. - Maintenance des bâtiments	3
20	Four. / Presta. - Maintenance informatique	1
21	Four. / Presta. - Matériel informatique	3
22	Four. / Presta. - Mobilier de bureau	3
23	Four. / Presta. - Nourriture et boissons	3
24	Four. / Presta. - Organismes de recherche	5
25	Four. / Presta. - Promotion de la marque	5
26	Four. / Presta. - Services de nettoyage	3
27	Four. / Presta. - Services de sécurité	3
28	Four. / Presta. - Services liés au e-commerce	3
29	Four. / Presta. - Sous-traitance production	5
30	Four. / Presta. - Télécommunications	3
31	Four. / Presta. - Transport de marchandise et logistique	5
32	Four. / Presta. - Transport de taxi et de personnes	3
33	Bénéficiaire d'actions de sponsoring / mécénat	10
34	Auditeurs / Organismes certificateurs (secteur privé)	5
35	Agents publics	10
\.


--
-- Data for Name: eval2_niveau_dependance_clarins_vs_tiers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_niveau_dependance_clarins_vs_tiers (id, niveau, poids) FROM stdin;
1	Faible	0
2	Moyen	1
3	Fort	2
4	N/A	0
\.


--
-- Data for Name: eval2_niveau_dependance_tiers_vs_clarins; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_niveau_dependance_tiers_vs_clarins (id, niveau, poids) FROM stdin;
1	Faible	0
2	Moyen	1
3	Fort	2
4	N/A	0
\.


--
-- Data for Name: eval2_pays_intervention; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_pays_intervention (id, pays, poids) FROM stdin;
1	Europe	1
2	Amérique du Nord	1
3	Amérique du Sud	2
4	Afrique	3
5	Asie	3
6	Moyen-Orient	3
7	Océanie	1
8	Afghanistan	2
9	Albanie	2
10	Algérie	2
11	Angola	2
12	Argentine	2
13	Arménie	1
14	Australie	0
15	Autriche	0
16	Azerbaïdjan	2
17	Bahamas	3
18	Bahreïn	1
19	Bangladesh	2
20	Barbade	3
21	Bélarus	2
22	Belgique	0
23	Bénin	1
24	Bhoutan	0
25	Bolivie	2
26	Bosnie-Herzégovine	2
27	Botswana	1
28	Brésil	2
29	Bulgarie	1
30	Burkina Faso	1
31	Burundi	2
32	Cabo Verde	0
33	Cambodge	2
34	Cameroun	2
35	Canada	0
36	République Centrafricaine	2
37	Tchad	2
38	Chili	0
39	Chine	1
40	Colombie	1
41	Comores	2
42	Congo	2
43	Costa Rica	1
44	Côte d'Ivoire	1
45	Croatie	1
46	Cuba	1
47	Chypre	3
48	Tchécoslovaquie	1
49	République démocratique du Congo	2
50	Danemark	0
51	Djibouti	2
52	Dominique	1
53	République Dominicaine	2
54	Équateur	2
55	Égypte	2
56	El Salvador	2
57	Guinée équatoriale	3
58	Erytrée	2
59	Estonie	0
60	Eswatini	2
61	Éthiopie	2
62	Fidji	1
63	Finlande	0
64	France	0
65	Gabon	2
66	Gambie	2
67	Géorgie	1
68	Allemagne	0
69	Ghana	1
70	Grèce	1
71	Grenade	3
72	Guatemala	2
73	Guinée	2
74	Guinée Bissau	2
75	Guyana	1
76	Haïti	3
77	Honduras	2
78	Hong Kong	0
79	Hongrie	1
80	Islande	0
81	Inde	2
82	Indonésie	2
83	Iran	2
84	Irak	2
85	Irlande	0
86	Israël	0
87	Italie	1
88	Jamaïque	1
89	Japon	0
90	Jordanie	1
91	Kazakhstan	2
92	Kenya	2
93	Corée, Nord	3
94	Corée, Sud	0
95	Kosovo	1
96	Koweït	1
97	Kirghizistan	2
98	Laos	2
99	Lettonie	0
100	Liban	2
101	Lesotho	2
102	Liberia	2
103	Libye	3
104	Lituanie	0
105	Luxembourg	0
106	Madagascar	2
107	Malawi	2
108	Malaisie	1
109	Maldives	2
110	Mali	2
111	Malte	1
112	Mauritanie	2
113	Maurice	3
114	Mexique	2
115	Moldavie	1
116	Mongolie	2
117	Monténégro	1
118	Maroc	2
119	Mozambique	2
120	Myanmar	2
121	Namibie	1
122	Népal	2
123	Pays-Bas	0
124	Nouvelle-Zélande	0
125	Nicaragua	3
126	Niger	2
127	Nigeria	2
128	Macédoine du Nord	1
129	Norvège	1
130	Oman	1
131	Pakistan	2
132	Panama	2
133	Papouasie-Nouvelle-Guinée	2
134	Paraguay	2
135	Pérou	2
136	Philippines	2
137	Pologne	1
138	Portugal	0
139	Qatar	1
140	Roumanie	1
141	Russie	3
142	Rwanda	1
143	Sainte-Lucie	1
144	Saint Vincent et les Grenadines	0
145	Sao Tomé et Principe	1
146	Arabie Saoudite	1
147	Sénégal	1
148	Serbie	2
149	Seychelles	0
150	Sierra Leone	2
151	Singapour	0
152	Slovaquie	1
153	Slovénie	1
154	Salomon (Îles)	1
155	Somalie	3
156	Afrique du Sud	1
157	Sud-Soudan	3
158	Espagne	0
159	Sri Lanka	2
160	Soudan	2
161	Suriname	1
162	Suède	0
163	Suisse	0
164	Syrie	3
165	Taïwan	0
166	Tadjikistan	2
167	Tanzanie	1
168	Thaïlande	2
169	Timor-Leste	1
170	Togo	2
171	Trinité-et-Tobago	1
172	Tunisie	1
173	Turquie	2
174	Turkménistan	3
175	Ouganda	2
176	Ukraine	2
177	Emirats Arabes Unis	0
178	Royaume-Uni	0
179	Etats-Unis d'Amérique	0
180	Uruguay	0
181	Ouzbékistan	2
182	Vanuatu	1
183	Venezuela	3
184	Vietnam	1
185	Yémen	3
186	Zambie	2
187	Zimbabwe	2
188	N/A	1
\.


--
-- Data for Name: eval2_qualification_tiers; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_qualification_tiers (id, qualification, poids) FROM stdin;
1	Public	2
2	Privé	0
3	Autre	1
\.


--
-- Data for Name: eval2_raisons_relation; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_raisons_relation (id, description, poids) FROM stdin;
1	Appel d'offres (UE)	0
2	Appel d'offres (hors UE)	1
3	Partenariat	1
4	Prospection	1
5	Action de sponsoring / mécénat	5
6	Affaires courantes	0
\.


--
-- Data for Name: eval2_region_intervention; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.eval2_region_intervention (id, region, poids) FROM stdin;
1	France - Siège	1
2	Marchés internationaux - Europe	1
3	Marchés internationaux - Amerique du Nord	1
4	Marchés internationaux - APAC	3
5	Marchés internationaux - Future Growth Markets	3
6	Global Travel Retail	3
\.


--
-- Name: eval2_antecedents_avec_le_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_antecedents_avec_le_tiers_id_seq', 2, true);


--
-- Name: eval2_categorisation_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_categorisation_tiers_id_seq', 2, true);


--
-- Name: eval2_criteres_selection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_criteres_selection_id_seq', 10, true);


--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_duree_envisagee_de_la_relation_contractuelle_id_seq', 3, true);


--
-- Name: eval2_encadrement_relation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_encadrement_relation_id_seq', 3, true);


--
-- Name: eval2_evaluation_risque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_evaluation_risque_id_seq', 7, true);


--
-- Name: eval2_flux_financier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_flux_financier_id_seq', 3, true);


--
-- Name: eval2_interaction_tiers_autre_partie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_interaction_tiers_autre_partie_id_seq', 2, true);


--
-- Name: eval2_intervention_autre_partie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_intervention_autre_partie_id_seq', 3, true);


--
-- Name: eval2_localisation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_localisation_id_seq', 360, true);


--
-- Name: eval2_modalites_de_renouvellement_contrat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_modalites_de_renouvellement_contrat_id_seq', 3, true);


--
-- Name: eval2_modalites_paiement_reglement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_modalites_paiement_reglement_id_seq', 4, true);


--
-- Name: eval2_nature_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_nature_tiers_id_seq', 35, true);


--
-- Name: eval2_niveau_dependance_clarins_vs_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_niveau_dependance_clarins_vs_tiers_id_seq', 4, true);


--
-- Name: eval2_niveau_dependance_tiers_vs_clarins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_niveau_dependance_tiers_vs_clarins_id_seq', 4, true);


--
-- Name: eval2_pays_intervention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_pays_intervention_id_seq', 188, true);


--
-- Name: eval2_qualification_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_qualification_tiers_id_seq', 3, true);


--
-- Name: eval2_raisons_relation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_raisons_relation_id_seq', 6, true);


--
-- Name: eval2_region_intervention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.eval2_region_intervention_id_seq', 6, true);


--
-- Name: eval2_antecedents_avec_le_tiers eval2_antecedents_avec_le_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_antecedents_avec_le_tiers
    ADD CONSTRAINT eval2_antecedents_avec_le_tiers_pkey PRIMARY KEY (id);


--
-- Name: eval2_categorisation_tiers eval2_categorisation_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_categorisation_tiers
    ADD CONSTRAINT eval2_categorisation_tiers_pkey PRIMARY KEY (id);


--
-- Name: eval2_criteres_selection eval2_criteres_selection_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_criteres_selection
    ADD CONSTRAINT eval2_criteres_selection_pkey PRIMARY KEY (id);


--
-- Name: eval2_duree_envisagee_de_la_relation_contractuelle eval2_duree_envisagee_de_la_relation_contractuelle_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_duree_envisagee_de_la_relation_contractuelle
    ADD CONSTRAINT eval2_duree_envisagee_de_la_relation_contractuelle_pkey PRIMARY KEY (id);


--
-- Name: eval2_encadrement_relation eval2_encadrement_relation_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_encadrement_relation
    ADD CONSTRAINT eval2_encadrement_relation_pkey PRIMARY KEY (id);


--
-- Name: eval2_evaluation_risque eval2_evaluation_risque_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_evaluation_risque
    ADD CONSTRAINT eval2_evaluation_risque_pkey PRIMARY KEY (id);


--
-- Name: eval2_flux_financier eval2_flux_financier_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_flux_financier
    ADD CONSTRAINT eval2_flux_financier_pkey PRIMARY KEY (id);


--
-- Name: eval2_interaction_tiers_autre_partie eval2_interaction_tiers_autre_partie_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_interaction_tiers_autre_partie
    ADD CONSTRAINT eval2_interaction_tiers_autre_partie_pkey PRIMARY KEY (id);


--
-- Name: eval2_intervention_autre_partie eval2_intervention_autre_partie_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_intervention_autre_partie
    ADD CONSTRAINT eval2_intervention_autre_partie_pkey PRIMARY KEY (id);


--
-- Name: eval2_localisation eval2_localisation_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_localisation
    ADD CONSTRAINT eval2_localisation_pkey PRIMARY KEY (id);


--
-- Name: eval2_modalites_de_renouvellement_contrat eval2_modalites_de_renouvellement_contrat_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_modalites_de_renouvellement_contrat
    ADD CONSTRAINT eval2_modalites_de_renouvellement_contrat_pkey PRIMARY KEY (id);


--
-- Name: eval2_modalites_paiement_reglement eval2_modalites_paiement_reglement_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_modalites_paiement_reglement
    ADD CONSTRAINT eval2_modalites_paiement_reglement_pkey PRIMARY KEY (id);


--
-- Name: eval2_nature_tiers eval2_nature_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_nature_tiers
    ADD CONSTRAINT eval2_nature_tiers_pkey PRIMARY KEY (id);


--
-- Name: eval2_niveau_dependance_clarins_vs_tiers eval2_niveau_dependance_clarins_vs_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_niveau_dependance_clarins_vs_tiers
    ADD CONSTRAINT eval2_niveau_dependance_clarins_vs_tiers_pkey PRIMARY KEY (id);


--
-- Name: eval2_niveau_dependance_tiers_vs_clarins eval2_niveau_dependance_tiers_vs_clarins_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_niveau_dependance_tiers_vs_clarins
    ADD CONSTRAINT eval2_niveau_dependance_tiers_vs_clarins_pkey PRIMARY KEY (id);


--
-- Name: eval2_pays_intervention eval2_pays_intervention_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_pays_intervention
    ADD CONSTRAINT eval2_pays_intervention_pkey PRIMARY KEY (id);


--
-- Name: eval2_qualification_tiers eval2_qualification_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_qualification_tiers
    ADD CONSTRAINT eval2_qualification_tiers_pkey PRIMARY KEY (id);


--
-- Name: eval2_raisons_relation eval2_raisons_relation_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_raisons_relation
    ADD CONSTRAINT eval2_raisons_relation_pkey PRIMARY KEY (id);


--
-- Name: eval2_region_intervention eval2_region_intervention_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.eval2_region_intervention
    ADD CONSTRAINT eval2_region_intervention_pkey PRIMARY KEY (id);


--
-- Name: eval2_raisons_relation_description_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX eval2_raisons_relation_description_idx ON public.eval2_raisons_relation USING btree (description);


--
-- PostgreSQL database dump complete
--

