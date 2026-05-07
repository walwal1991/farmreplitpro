--
-- PostgreSQL database dump
--

\restrict AwcwpuVxXBzh2Pbdj0ofnm4VHCdCedLnjBk5RTVNnzBx7yekdEeIHrotaYhJlbA

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    body text,
    reference_id integer,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_sessions (
    id integer NOT NULL,
    token text NOT NULL,
    username text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_sessions OWNER TO postgres;

--
-- Name: admin_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_sessions_id_seq OWNER TO postgres;

--
-- Name: admin_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_sessions_id_seq OWNED BY public.admin_sessions.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: consultations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultations (
    id integer NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    soil_type text NOT NULL,
    crop text NOT NULL,
    problem text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.consultations OWNER TO postgres;

--
-- Name: consultations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultations_id_seq OWNER TO postgres;

--
-- Name: consultations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    customer_name character varying(200) NOT NULL,
    phone character varying(50),
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    admin_reply text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    customer_id integer,
    is_admin_initiated boolean DEFAULT false NOT NULL
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_messages_id_seq OWNER TO postgres;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_enrollments (
    id integer NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    course_id text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    training_link text,
    message_sent_at timestamp with time zone
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

--
-- Name: course_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_enrollments_id_seq OWNER TO postgres;

--
-- Name: course_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_enrollments_id_seq OWNED BY public.course_enrollments.id;


--
-- Name: customer_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_sessions (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_sessions OWNER TO postgres;

--
-- Name: customer_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_sessions_id_seq OWNER TO postgres;

--
-- Name: customer_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_sessions_id_seq OWNED BY public.customer_sessions.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_blocked boolean DEFAULT false NOT NULL,
    referral_code text,
    referred_by_id integer
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_sessions (
    id integer NOT NULL,
    token text NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.delivery_sessions OWNER TO postgres;

--
-- Name: delivery_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_sessions_id_seq OWNER TO postgres;

--
-- Name: delivery_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_sessions_id_seq OWNED BY public.delivery_sessions.id;


--
-- Name: delivery_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    role text DEFAULT 'driver'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    available boolean DEFAULT true NOT NULL,
    blocked_reason text
);


ALTER TABLE public.delivery_users OWNER TO postgres;

--
-- Name: delivery_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_users_id_seq OWNER TO postgres;

--
-- Name: delivery_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_users_id_seq OWNED BY public.delivery_users.id;


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discount_codes (
    id integer NOT NULL,
    donor_id integer,
    code character varying(20) NOT NULL,
    discount_percent integer DEFAULT 10 NOT NULL,
    points_used integer DEFAULT 0 NOT NULL,
    used boolean DEFAULT false NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id integer,
    source text DEFAULT 'donor_points'::text NOT NULL,
    expires_at timestamp with time zone
);


ALTER TABLE public.discount_codes OWNER TO postgres;

--
-- Name: discount_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discount_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_codes_id_seq OWNER TO postgres;

--
-- Name: discount_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discount_codes_id_seq OWNED BY public.discount_codes.id;


--
-- Name: donor_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donor_sessions (
    id integer NOT NULL,
    donor_id integer NOT NULL,
    token character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.donor_sessions OWNER TO postgres;

--
-- Name: donor_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donor_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donor_sessions_id_seq OWNER TO postgres;

--
-- Name: donor_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donor_sessions_id_seq OWNED BY public.donor_sessions.id;


--
-- Name: donors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donors (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    green_points integer DEFAULT 0 NOT NULL,
    total_kg_donated numeric(10,2) DEFAULT 0 NOT NULL,
    badge character varying(20) DEFAULT 'seedling'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    username character varying(60)
);


ALTER TABLE public.donors OWNER TO postgres;

--
-- Name: donors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donors_id_seq OWNER TO postgres;

--
-- Name: donors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donors_id_seq OWNED BY public.donors.id;


--
-- Name: fertilizer_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fertilizer_batches (
    id integer NOT NULL,
    batch_code character varying(20) NOT NULL,
    source_type character varying(20) DEFAULT 'mixed'::character varying NOT NULL,
    source_description text,
    nitrogen numeric(5,2) DEFAULT 0 NOT NULL,
    phosphorus numeric(5,2) DEFAULT 0 NOT NULL,
    potassium numeric(5,2) DEFAULT 0 NOT NULL,
    organic_matter numeric(5,2) DEFAULT 0 NOT NULL,
    production_date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fertilizer_batches OWNER TO postgres;

--
-- Name: fertilizer_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fertilizer_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fertilizer_batches_id_seq OWNER TO postgres;

--
-- Name: fertilizer_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fertilizer_batches_id_seq OWNED BY public.fertilizer_batches.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    notes text,
    product_id integer,
    product_name text NOT NULL,
    unit_price double precision NOT NULL,
    quantity integer NOT NULL,
    total_price double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_driver_id integer,
    assigned_driver_name text,
    tracking_number text,
    customer_id integer,
    requires_signature boolean DEFAULT false NOT NULL,
    proof_image text,
    signature_image text,
    delivered_at timestamp with time zone,
    discount_code_used text,
    discount_amount integer DEFAULT 0,
    payment_method text DEFAULT 'cod'::text NOT NULL,
    chargily_checkout_id text,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    subscription_id integer,
    items_json text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_reviews (
    id integer NOT NULL,
    product_id integer NOT NULL,
    customer_id integer,
    customer_name text NOT NULL,
    rating integer NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.product_reviews OWNER TO postgres;

--
-- Name: product_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_reviews_id_seq OWNER TO postgres;

--
-- Name: product_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_reviews_id_seq OWNED BY public.product_reviews.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    unit text NOT NULL,
    weight_kg double precision,
    image_url text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'solid'::text NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: sensor_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_devices (
    id integer NOT NULL,
    device_id text NOT NULL,
    token text NOT NULL,
    name text NOT NULL,
    location text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_devices OWNER TO postgres;

--
-- Name: sensor_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_devices_id_seq OWNER TO postgres;

--
-- Name: sensor_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_devices_id_seq OWNED BY public.sensor_devices.id;


--
-- Name: sensor_readings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_readings (
    id integer NOT NULL,
    device_id text NOT NULL,
    moisture real NOT NULL,
    temperature real,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_readings OWNER TO postgres;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_readings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_readings_id_seq OWNER TO postgres;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_readings_id_seq OWNED BY public.sensor_readings.id;


--
-- Name: subscription_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_deliveries (
    id integer NOT NULL,
    subscription_id integer NOT NULL,
    month_label text NOT NULL,
    status text DEFAULT 'preparing'::text NOT NULL,
    tracking_number text,
    notes text,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_deliveries OWNER TO postgres;

--
-- Name: subscription_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_deliveries_id_seq OWNER TO postgres;

--
-- Name: subscription_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_deliveries_id_seq OWNED BY public.subscription_deliveries.id;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_plans (
    id integer NOT NULL,
    name text NOT NULL,
    name_ar text NOT NULL,
    name_fr text NOT NULL,
    description text NOT NULL,
    description_ar text NOT NULL,
    description_fr text NOT NULL,
    price_per_month double precision NOT NULL,
    fertilizer_kg double precision NOT NULL,
    includes_tips boolean DEFAULT true NOT NULL,
    includes_plan boolean DEFAULT false NOT NULL,
    includes_consultation boolean DEFAULT false NOT NULL,
    color text DEFAULT 'green'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO postgres;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_plans_id_seq OWNER TO postgres;

--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    plan_id integer NOT NULL,
    plan_name text NOT NULL,
    price_at_subscription double precision NOT NULL,
    fertilizer_kg double precision NOT NULL,
    crop_type text,
    delivery_address text NOT NULL,
    delivery_city text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    next_renewal_date timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_method text DEFAULT 'cod'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    chargily_checkout_id text
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: waste_collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waste_collections (
    id integer NOT NULL,
    request_code character varying(20) NOT NULL,
    source_type character varying(20) DEFAULT 'household'::character varying NOT NULL,
    contact_name character varying(120) NOT NULL,
    contact_phone character varying(20) NOT NULL,
    address text NOT NULL,
    waste_type character varying(30) DEFAULT 'mixed'::character varying NOT NULL,
    estimated_weight_kg numeric(7,2),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_date date,
    collected_date date,
    processing_start_date date,
    completed_date date,
    linked_batch_code character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.waste_collections OWNER TO postgres;

--
-- Name: waste_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.waste_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waste_collections_id_seq OWNER TO postgres;

--
-- Name: waste_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.waste_collections_id_seq OWNED BY public.waste_collections.id;


--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: admin_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions ALTER COLUMN id SET DEFAULT nextval('public.admin_sessions_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: consultations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: course_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments ALTER COLUMN id SET DEFAULT nextval('public.course_enrollments_id_seq'::regclass);


--
-- Name: customer_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_sessions ALTER COLUMN id SET DEFAULT nextval('public.customer_sessions_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sessions ALTER COLUMN id SET DEFAULT nextval('public.delivery_sessions_id_seq'::regclass);


--
-- Name: delivery_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_users ALTER COLUMN id SET DEFAULT nextval('public.delivery_users_id_seq'::regclass);


--
-- Name: discount_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes ALTER COLUMN id SET DEFAULT nextval('public.discount_codes_id_seq'::regclass);


--
-- Name: donor_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_sessions ALTER COLUMN id SET DEFAULT nextval('public.donor_sessions_id_seq'::regclass);


--
-- Name: donors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors ALTER COLUMN id SET DEFAULT nextval('public.donors_id_seq'::regclass);


--
-- Name: fertilizer_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fertilizer_batches ALTER COLUMN id SET DEFAULT nextval('public.fertilizer_batches_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: product_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews ALTER COLUMN id SET DEFAULT nextval('public.product_reviews_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: sensor_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_devices ALTER COLUMN id SET DEFAULT nextval('public.sensor_devices_id_seq'::regclass);


--
-- Name: sensor_readings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings ALTER COLUMN id SET DEFAULT nextval('public.sensor_readings_id_seq'::regclass);


--
-- Name: subscription_deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_deliveries ALTER COLUMN id SET DEFAULT nextval('public.subscription_deliveries_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: waste_collections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waste_collections ALTER COLUMN id SET DEFAULT nextval('public.waste_collections_id_seq'::regclass);


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_notifications (id, type, title, body, reference_id, is_read, created_at) FROM stdin;
1	new_order	طلب جديد #45	salima anifeg — سعيدة — 2500 د.ج	45	t	2026-05-02 14:50:37.762129+00
2	new_order	طلب جديد #41	kader chaili — magino — 1020 د.ج	41	t	2026-05-01 14:49:27.294636+00
3	new_order	طلب جديد #40	kader chaili — magino — 1200 د.ج	40	t	2026-05-01 14:47:41.080122+00
4	new_order	طلب جديد #39	kader chaili — magino — 2200 د.ج	39	t	2026-05-01 14:41:44.494756+00
5	new_order	طلب جديد #38	bilal boussaadi — magino — 1200 د.ج	38	t	2026-05-01 14:39:29.352317+00
6	new_order	طلب جديد #37	echaima boussadi — jersey city — 800 د.ج	37	t	2026-05-01 12:36:37.184625+00
7	new_order	طلب جديد #36	kader chaili — jersey city — 800 د.ج	36	t	2026-05-01 09:28:58.817701+00
8	new_order	طلب جديد #33	Test — Alger — 1200 د.ج	33	t	2026-05-01 09:10:53.258439+00
9	new_order	طلب جديد #32	Test — Alger — 1200 د.ج	32	t	2026-05-01 09:10:46.80836+00
10	new_order	طلب جديد #24	adam anifak — ksar el boukhari  — 750 د.ج	24	t	2026-04-28 13:59:24.59825+00
13	new_order	طلب جديد #50	nour nihal — ksar el boukhari — 750 د.ج	50	t	2026-05-04 08:42:37.736988+00
14	new_order	طلب جديد #51	nour nihal — ksar el boukhari — 1200 د.ج	51	t	2026-05-04 08:42:38.413625+00
15	new_order	طلب جديد #52	اختبار — الجزائر — 3200 د.ج	52	t	2026-05-04 08:49:10.874245+00
16	new_order	طلب جديد #53	nour nihal — ksar el boukhari — 4950 د.ج	53	t	2026-05-04 08:52:41.387905+00
17	new_order	طلب جديد #54	nihal anifeg — ksar el boukhari — 7200 د.ج	54	t	2026-05-04 09:21:43.975151+00
18	new_order	طلب جديد #55	bilal boussaadi — magino — 4000 د.ج	55	t	2026-05-04 09:25:39.382699+00
19	new_order	طلب جديد #56	fatma boussadi — magino — 4500 د.ج	56	t	2026-05-04 09:32:23.015714+00
21	new_order	طلب جديد #58	nassira anifeg — medea — 750 د.ج	58	t	2026-05-04 09:37:43.958954+00
20	new_order	طلب جديد #57	isha9 boussadi — magino — 7000 د.ج	57	t	2026-05-04 09:36:49.436108+00
22	new_order	طلب جديد #59	habib khelifi — ksar el boukhari  — 2200 د.ج	59	t	2026-05-06 08:37:44.90401+00
23	new_order	طلب جديد #60	walid anifak — ksar el boukhari  — 4000 د.ج	60	t	2026-05-06 08:45:31.957002+00
24	new_order	طلب جديد #61	abdo tejini — ksar el boukhari  — 400 د.ج	61	t	2026-05-06 09:02:50.788306+00
25	new_order	طلب جديد #63	abdo tejini — ksar el boukhari  — 63000 د.ج	63	t	2026-05-06 09:45:09.199085+00
26	new_order	طلب جديد #65	abdo tejini — ksar el boukhari — 3150 د.ج	65	f	2026-05-06 10:07:48.66997+00
\.


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_sessions (id, token, username, created_at, expires_at) FROM stdin;
1	bcc5d68b7b695ca001273062d454741cf60cba7d69f40669be23d61dce386a15	admin	2026-04-24 10:54:16.313033+00	2026-05-24 10:54:16.311+00
2	e67b12cc24f2cd8f6159181f8f731945404e218ee4ddfbb4e54119c5fa0fd14c	admin	2026-04-24 10:54:42.004649+00	2026-05-24 10:54:42.002+00
3	0395820597ae172b725948c8f01c3195a62ef159aae40c08cdd64c4d75bbde87	admin	2026-04-24 10:55:12.150648+00	2026-05-24 10:55:12.15+00
4	6e6629f4f55bd5ed7c0490db4ab2f8f287c7ebda6a10099215b0b3e0e8847151	admin	2026-04-24 10:59:15.359118+00	2026-05-24 10:59:15.358+00
5	cb9531b6a32b3268ce578a7acbd3c9379dc17f1e8951b0abf170d9861bec219f	admin	2026-04-24 10:59:55.941872+00	2026-05-24 10:59:55.941+00
6	76f030729891608ccdff167380164deec39cd62c69e56abe1b65ba738dd69326	admin	2026-04-24 11:02:00.980946+00	2026-05-24 11:02:00.98+00
7	99c59304b7c1561d855ee79bcce0dccaa01ca300929e5c1210c3194b30e4db58	admin	2026-04-24 11:08:29.177331+00	2026-05-24 11:08:29.176+00
8	e0cb0caf1326636a441f1d9471ab08fe457e5bc754ab2248add70f177b263748	admin	2026-04-24 11:45:01.214037+00	2026-05-24 11:45:01.213+00
9	24ba97519988b6f98039165676604f2ad0337c26803305c3559e8f4aa7d770d8	admin	2026-04-24 11:52:59.24855+00	2026-05-24 11:52:59.248+00
10	c352dbe87708f32dcf081aa28c640fd354696533074b9df607bb790ace67b7ba	admin	2026-04-24 11:58:43.102514+00	2026-05-24 11:58:43.102+00
11	6f2d04e9158f48ea5fb75649e2544d84a9c986921af332ac393d180f700e55e6	admin	2026-04-24 12:33:55.543981+00	2026-05-24 12:33:55.543+00
12	f0b7648ddb0fc1733684472352776d4e2619037a369b818dbcf8fdf5ff56ebe4	admin	2026-04-24 12:55:36.64323+00	2026-05-24 12:55:36.642+00
13	d6102dfa8b009fc4e9e5cf321aef0539c465903826ae90624443c89d52448980	admin	2026-04-24 13:01:05.855831+00	2026-05-24 13:01:05.854+00
14	a376b2305614d468a4bb68f844f2db840abcc4e587555ad27b82fea15d60bf7e	admin	2026-04-24 13:01:16.894424+00	2026-05-24 13:01:16.893+00
15	138e3fe7ce694708c086030b74dcba50e49e345f42d053c97bd050846b9b46b5	admin	2026-04-24 13:05:22.653402+00	2026-05-24 13:05:22.653+00
16	9c822206ac36ab9b02a46d56e497f083314cbf15403e22b351c5aad985f89161	admin	2026-04-24 13:10:18.303418+00	2026-05-24 13:10:18.302+00
17	4d5721a80e924ceaa135b547351b39c401ab4ec62f5bff40967b2503b247b70e	admin	2026-04-24 13:20:47.168924+00	2026-05-24 13:20:47.167+00
18	6b86c6404db504251c7048d8649303272375d8fc9cd569e3b0ed2b9d12096b66	admin	2026-04-24 13:27:59.078063+00	2026-05-24 13:27:59.077+00
19	5afb7087b6439d274a4ef3a38917a9dd2e08e55338e4141fbb3da1e2c8af09bb	admin	2026-04-24 13:31:17.099296+00	2026-05-24 13:31:17.098+00
20	3cbe87d9f17f60ceaa8e2c789b3db55842ad4d6c1357b844759b3d726bc3ff6a	admin	2026-04-24 13:36:47.232788+00	2026-05-24 13:36:47.232+00
21	653333aaec8d2c4fb777d76d8ea103d461c86037761e42df58d59776741d809d	admin	2026-04-24 13:42:55.562571+00	2026-05-24 13:42:55.56+00
22	266da086cce67a6cfed268c3f40fd3d2518798726a0e4091195c7627e6a946a5	admin	2026-04-24 13:44:01.809672+00	2026-05-24 13:44:01.809+00
23	3645eeead43868bf639bea99658632cd9f3b61c07f0aeabceb2b65b07e7e76fb	admin	2026-04-24 13:49:46.159579+00	2026-05-24 13:49:46.158+00
24	39f1e9784452c5bb88ad9c4e751393541666f723e48167bae23b2c352134df4a	admin	2026-04-24 13:50:55.801687+00	2026-05-24 13:50:55.801+00
25	791ce2ebd0c816307ba93bfe24fef12f25e50eb9c50b084cc512157b0c0d02b9	admin	2026-04-24 15:21:45.37507+00	2026-05-24 15:21:45.374+00
26	1c661fff5ec2dfde7f2dc7dc96f0668dcdd2c2147ac3aca288b8517967365887	admin	2026-04-24 15:30:33.090335+00	2026-05-24 15:30:33.089+00
27	561a7989d4d6775d500338ddd70e1f4f6a3ac6ad17949b6a6a42eb16ba906605	admin	2026-04-24 16:11:25.896791+00	2026-05-24 16:11:25.896+00
28	8feb4e93d9da8237604aa59bceee5d3f5ff073e8a334a8305166487b921658ca	admin	2026-04-24 16:17:34.623062+00	2026-05-24 16:17:34.622+00
29	04444f786da2e3db7eb266d51076f4871faad526d60087b6c7755a8d6ffd9e69	admin	2026-04-24 19:41:03.887895+00	2026-05-24 19:41:03.886+00
30	358ac4a474fd11116e253218c74e134a9556d6d93e943d6895b30433bdec6289	admin	2026-04-24 19:44:06.29874+00	2026-05-24 19:44:06.298+00
31	906444f01ee1c0fa41bee01e47362502a24fd7e87e93534e6d6ff96c7d9b8e2c	admin	2026-04-24 19:53:20.555776+00	2026-05-24 19:53:20.554+00
32	ef72afd41bd0a365bf7b1c44474454b069e4615b0787af4d062793e16e7f8435	admin	2026-04-24 20:03:01.548845+00	2026-05-24 20:03:01.548+00
33	dc4d398c4da5e8f96c0b4cf473938b684c8ad6eb2b3ed41e9aa62f2bdb68b313	admin	2026-04-24 20:09:50.463381+00	2026-05-24 20:09:50.462+00
34	332707fd1314abeaf517e4a316609a0da29dfdfe8b3355db54c3256378ee3f8a	admin	2026-04-24 20:17:33.49285+00	2026-05-24 20:17:33.492+00
35	5785fabe0a80ce648d1c91e212375a6344301416ac9d668f0207f896df5571dd	admin	2026-04-24 20:18:36.459481+00	2026-05-24 20:18:36.459+00
36	a129d1bf775162aa94a614576d4260d4d7b2541b16cc9a48b86e10ee7ec681bc	admin	2026-04-24 20:22:02.4574+00	2026-05-24 20:22:02.456+00
37	5f8d297eaaf6aa6aba365c239231466a95a549c83068f06d9394130f252a83e1	admin	2026-04-24 20:26:49.845261+00	2026-05-24 20:26:49.844+00
38	21f46bd7c1dfeec5366040bad65ee2a2381dfcfb6e32cee4f96bff69f7b46bf5	admin	2026-04-24 20:27:58.808308+00	2026-05-24 20:27:58.807+00
39	c45285f5929ab917523c8ec44385825bde751044081974d6f98b1e099cc00942	admin	2026-04-24 20:34:05.260403+00	2026-05-24 20:34:05.259+00
40	5937117e86b418de5d04d9a8bcb9f2e015e3cd5e0483321611bd91d14693458e	admin	2026-04-24 20:43:37.954837+00	2026-05-24 20:43:37.954+00
41	e82c021434e77f446243d441fdb435dd2990cf72f16bd22b86cad0eb15db83c8	admin	2026-04-24 20:44:56.59561+00	2026-05-24 20:44:56.595+00
42	f94e48185d4d752de99cbf3264b6d1a750805e0d21a28b8186ed9a1fb1df4506	admin	2026-04-25 08:48:57.809274+00	2026-05-25 08:48:57.808+00
43	631f7fb6901be5bcc0049f0004e1a7a99d76731386e5e98afef4b36d51640374	admin	2026-04-25 09:10:14.660598+00	2026-05-25 09:10:14.66+00
44	a38574d967c0817473fb0fec39850df0ebe77d85b221406c74bc88f7b59a34b2	admin	2026-04-25 09:17:56.332576+00	2026-05-25 09:17:56.332+00
45	828ac75894b875b12a4e59b16ca4ab0686028e224a0ea29f13b14680573b2857	admin	2026-04-25 09:20:09.841086+00	2026-05-25 09:20:09.84+00
46	7fdd9f6738ffb1803999b2bcd8a88ca58c207a8861bd1948ade8006be47e1966	admin	2026-04-27 08:45:20.728216+00	2026-05-27 08:45:20.727+00
47	bc8d79730e37526c9ef77a8ad797aef8aadf5c9ca6eebdefa2f569be046ef5b0	admin	2026-04-27 08:48:41.164508+00	2026-05-27 08:48:41.164+00
48	26aa34b1e1fec73c66c9236113f75f1578fab7b67acc64c24d7b931627d13dbd	admin	2026-04-27 08:49:56.955538+00	2026-05-27 08:49:56.955+00
49	a568f39a1d61841f46395812d2a3d06608e1cca58822c9a141a95ef4afab43d4	admin	2026-04-27 09:06:02.591778+00	2026-05-27 09:06:02.591+00
50	19706d48381c9aad6bf86bd3d6844d8c5f1480e9a1d528776360269167c30cff	admin	2026-04-27 09:10:24.923738+00	2026-05-27 09:10:24.923+00
51	dc11aad4d76dc0da36143064121c6c5e92698f3ee7765ccbb71a2a80eef004d3	admin	2026-04-27 09:11:46.055859+00	2026-05-27 09:11:46.055+00
52	ab213999ba0caf5847781bca3cb01a9b630a7fa7ce9cf1c668e7845b666c05e5	admin	2026-04-27 09:16:23.204051+00	2026-05-27 09:16:23.203+00
53	ae0a404e4588e191a74a517a0b1006695e33497b96545bd80a5ee6a1f43d1e7b	admin	2026-04-27 09:17:44.804759+00	2026-05-27 09:17:44.804+00
54	712b359e99715bff4595bcd3181253c4df8d8c68a68a8719e84627f636fe3053	admin	2026-04-27 09:18:25.999818+00	2026-05-27 09:18:25.999+00
55	2def41b6a891f9df95c211227f2f35f33d419a2499a910e5511899389b1646b3	admin	2026-04-27 09:19:46.904882+00	2026-05-27 09:19:46.904+00
56	1c5fa15214d76f1372b78598d2d164eacf500df57adf2762d58d8b36c3311e1e	admin	2026-04-27 09:29:44.091987+00	2026-05-27 09:29:44.091+00
57	e04276c401bd896a53a6a3533d06c154273adbdc427eafd84d2a187410d7aae7	admin	2026-04-27 09:34:09.220212+00	2026-05-27 09:34:09.219+00
58	a93f5ddb118b6016535e0786443dcc686c2a86c3b8571ed085585c9459168622	admin	2026-04-27 09:43:04.081087+00	2026-05-27 09:43:04.08+00
59	ab06b2b6d8861f2022b6a4ba41b9825ee8f5a257809309c39c663de96b3340ec	admin	2026-04-27 09:46:35.28529+00	2026-05-27 09:46:35.284+00
60	39512f3cbe0cce7425c91c7fc790b2e2c975ba8268c265833026c4d1eebd2ada	admin	2026-04-27 09:48:19.661982+00	2026-05-27 09:48:19.661+00
61	d3e815a6754377efd279feb3ad00e09dcb4b97817abd94a38b4251310683064b	admin	2026-04-27 19:39:40.849978+00	2026-05-27 19:39:40.849+00
62	04e869a89663462b77b92d7b84d1d9ed898f4bfcb5681c96f4bf763428f6be2e	admin	2026-04-27 19:41:16.90263+00	2026-05-27 19:41:16.902+00
63	2d79bc5b74e12cf50dde45d0f996e806d13750a3b9847668c2e70de9d4edfca1	admin	2026-04-27 19:42:02.801635+00	2026-05-27 19:42:02.801+00
64	21b4f02c29aa281d6578f38643c615723a289eb86db3ddd8572c25f3756ca0a8	admin	2026-04-27 19:44:24.280144+00	2026-05-27 19:44:24.279+00
65	a11f4d34d086f8a65d754fa2fa556a0da9868e7edd128ad5c32d36ae7b0a65df	admin	2026-04-27 19:45:30.223758+00	2026-05-27 19:45:30.223+00
66	e02c56421c203774188edbd3b781c4867caa646dda05f4c8e2da20cc87a66b0b	admin	2026-04-27 23:26:51.791851+00	2026-05-27 23:26:51.79+00
67	19bf0bc46eafaf6ad81a5c32fb580d61c5b092b28f05f9689bf90d1b0f991f73	admin	2026-04-27 23:32:34.32244+00	2026-05-27 23:32:34.322+00
68	73f7d7c22c91e70cdcd78d72ae28eaf7c109a139ec0391aa285792bcca1d566a	admin	2026-04-27 23:40:00.007697+00	2026-05-27 23:40:00.007+00
69	341ce5bb41f8e5ce9f92e0ce18b33cebddd640cd47bd35d3a249ff0370726557	admin	2026-04-27 23:58:28.988405+00	2026-05-27 23:58:28.987+00
70	62f091f7aae87ee6f548e8e7720e4673e1e51f58a5a15e852c56f490203ae249	admin	2026-04-28 00:01:25.934869+00	2026-05-28 00:01:25.933+00
71	9a14f97d0991e215e6d87408bf8dd9089fe9ea011dde68342f7d226f75ba7e69	admin	2026-04-28 00:07:39.218819+00	2026-05-28 00:07:39.218+00
72	8e59789da99954d746638a88d197d3c16fe5f83b8359d252fc95c7b3b161151e	admin	2026-04-28 00:17:17.330141+00	2026-05-28 00:17:17.329+00
73	3e80877fac4a052da1524fa61758a0e4bb8f869d99866478fd941f557a716b65	admin	2026-04-28 00:18:29.856863+00	2026-05-28 00:18:29.856+00
74	30636815f1eba2f85df267a4791ce407aaaa967aa374bb77877d6dd8bcda6df0	admin	2026-04-28 00:24:48.27502+00	2026-05-28 00:24:48.274+00
75	6bb44907337499f2224dbd64d1e3208f6f85537f54b9af420b7d8bc22b7581a6	admin	2026-04-28 00:25:26.960001+00	2026-05-28 00:25:26.959+00
76	ea1a36d99e924adabdbc1b315507e24b85fcedb2450d615d1edfe33860771616	admin	2026-04-28 00:26:40.376689+00	2026-05-28 00:26:40.376+00
77	c0226242dbe7b1f3158bed2ea35bcc01ef4ea8e9e92d53a2ffd697c66af1491f	admin	2026-04-28 00:33:17.169103+00	2026-05-28 00:33:17.168+00
78	4b2a3f2e0c60bafd633164de2aeeeb4da021c4b2accdeaf645ab0b5111dce4e9	admin	2026-04-28 00:35:09.010192+00	2026-05-28 00:35:09.009+00
79	6edfee71fe33006b953039cf13ab82c1e033b5302f7b6b3aec74417688daab00	admin	2026-04-28 00:37:38.878795+00	2026-05-28 00:37:38.878+00
80	a40dd6b3213066f6a6d4153b2865f25260b73fffec3fa779fe5036f7050b01e4	admin	2026-04-28 00:43:21.541155+00	2026-05-28 00:43:21.54+00
81	a698d0973705d1f2ea9f91e0aa326decbc070979bc909f95c7cc94db2d8224d3	admin	2026-04-28 00:46:05.116714+00	2026-05-28 00:46:05.116+00
82	3bdfb91fab6044b686f3e2389f4ac4a5c2db08ae02e7b67470326618dbf59693	admin	2026-04-28 00:47:01.390041+00	2026-05-28 00:47:01.389+00
83	6e088e33322f0bbabae4ec7b39863b0fbb960bb0438a048f0d194214cc9778c4	admin	2026-04-28 00:50:11.410287+00	2026-05-28 00:50:11.409+00
84	fd0d1c124c68bdbcab521a668b1a72f2e15f891e2a10807bbaa7a18f691103a5	admin	2026-04-28 00:50:33.679654+00	2026-05-28 00:50:33.679+00
85	d6b599df50a934704c5dbc5c4b13ccc4d3eda6f6e40842ea67ca892ccfcdaaf3	admin	2026-04-28 00:51:40.427955+00	2026-05-28 00:51:40.427+00
86	9324c236749f3bee25f3d074bfa24ea55006a4d3fdbd0cc73a33eeb968c24852	admin	2026-04-28 09:18:43.9242+00	2026-05-28 09:18:43.923+00
87	88fdb998c387a4436ddbdec320d9c0db9e004e3811da7b8e33340f923505adcd	admin	2026-04-28 09:21:21.272361+00	2026-05-28 09:21:21.271+00
88	9982b24f62872b6100a27b8853c14f6126ae9916aa987526549f26fb1a7c4c2d	admin	2026-04-28 09:29:26.902683+00	2026-05-28 09:29:26.901+00
89	73ecee2071ade347c019805f99d23dd2911814cebec0c855632cc7d40ba69f90	admin	2026-04-28 09:33:18.372864+00	2026-05-28 09:33:18.372+00
90	bc9bd2f052438d6f7f40b1b83c032874f6c1b6b48127fda715a7af73f630e123	admin	2026-04-28 09:37:26.698051+00	2026-05-28 09:37:26.696+00
91	00dc602d4736970e879763ce2592b72c8a4294b83aa17f212f93e88119002657	admin	2026-04-28 09:39:14.625545+00	2026-05-28 09:39:14.625+00
92	02a9371d49204ff1324fc44bf01551aa26a3ce28ead0d625720f60560600d3ff	admin	2026-04-28 09:40:58.754063+00	2026-05-28 09:40:58.753+00
93	2251c0000f07dd30c433c2e6ace862c20be096be5ae86c2b6d273ac2769a2bf9	admin	2026-04-28 09:46:51.986196+00	2026-05-28 09:46:51.985+00
94	ceb280ed4cd6a11725c7bef3562377d700da22c7caadbb0d6c8ec0341541061f	admin	2026-04-28 10:19:51.825576+00	2026-05-28 10:19:51.824+00
95	09ba560fc7f0c2710e92109ecce37e241bd4185475d1274405bc53068d297252	admin	2026-04-28 10:22:39.18311+00	2026-05-28 10:22:39.182+00
96	c171c060ad5717265c450183d2b030bea93cd9cb874c6f98d111b04fc27ffc4e	admin	2026-04-28 10:25:13.695819+00	2026-05-28 10:25:13.695+00
97	0b3497e7c9df6cc755acf68da1fb9819da52697036f491bf3d68758c6703e023	admin	2026-04-28 10:45:24.169198+00	2026-05-28 10:45:24.168+00
98	f2400486d5e1dbf1411b523885be57d4c3b298e959b829f60a4f292ca7d88b77	admin	2026-04-28 10:45:48.114095+00	2026-05-28 10:45:48.113+00
99	a2c075556a111d386ee6ff307d472551e2bee2f4ccef4f23469570f07e154e8d	admin	2026-04-28 10:57:33.488189+00	2026-05-28 10:57:33.487+00
100	ac6564839900e2f652e71fdae6e147cfed37d3512fbc5efc496431e94e3dd93f	admin	2026-04-28 13:54:49.871969+00	2026-05-28 13:54:49.87+00
101	8cc515635f3c886719c97494e019fc3537884a49b6eca7a10f1194aab19c8e19	admin	2026-04-28 13:59:34.159985+00	2026-05-28 13:59:34.159+00
102	3522f0c857fad01c2fa45dde8da4c6bfb1405c08c116c39a0091663afbf802d7	admin	2026-04-28 14:00:06.865072+00	2026-05-28 14:00:06.864+00
103	5e27e762269157649b1c90627e9ce910424994d8723e1a5e8f29ea73add9e507	admin	2026-04-28 14:01:59.460839+00	2026-05-28 14:01:59.46+00
104	7d708f8aa579a0066a75809b989ee216a9b0c8ce8776d64ec5537049b2378f3b	admin	2026-04-28 15:02:30.81403+00	2026-05-28 15:02:30.813+00
105	0505cafc36eec94cc5bbbe4e1e3ee4e62a1ce0b0567b89c685af5075b664a35f	admin	2026-04-28 15:17:28.725075+00	2026-05-28 15:17:28.724+00
106	f35b2b5ddd68c095c1a5a734a3e249c10b3a8a67eee8a6bd0ec8272a39e774da	admin	2026-04-28 15:27:16.772402+00	2026-05-28 15:27:16.771+00
107	8e8538b66ddaeed9d1a1147b12d8b2c048e4f0bf20cc0b0c4b7d37dee61c417a	admin	2026-04-28 15:35:46.340869+00	2026-05-28 15:35:46.339+00
108	e3d0c916268618d407632068adbb0e5010e78683df167ddfec0084e5a583a8ae	admin	2026-04-28 15:39:08.436162+00	2026-05-28 15:39:08.435+00
109	3865c8743024e631b11b7ce576cf1e002096b03a6130a61bf256fe21bb6e5a47	admin	2026-04-28 15:43:48.442438+00	2026-05-28 15:43:48.441+00
110	cea9c23b2aec7ebd63b0d2015360e4037dfd618355a31c8d5e2b1d8de39304bd	admin	2026-04-28 15:46:22.420555+00	2026-05-28 15:46:22.419+00
111	ffc61e17932c0a15c20b4834f37bd94c10a8bbd7f7ceba738884e9ac13cbed4c	admin	2026-04-29 08:55:46.194159+00	2026-05-29 08:55:46.193+00
112	a4e86374bcb77a257e192f5d9ae4c1950426b4075f55f974a8cf2d96a1512cca	admin	2026-04-29 09:15:10.707801+00	2026-05-29 09:15:10.707+00
113	e44b8825331892c780f5bf78d76a062c3358dafaa75d85e4b14c52cce49e6e23	admin	2026-04-29 09:28:22.357431+00	2026-05-29 09:28:22.356+00
114	e3d824114edb3c04fb5006cb29130014da2e4e35592fb1998471c6e7024839ce	admin	2026-04-29 09:44:34.134749+00	2026-05-29 09:44:34.134+00
115	b4527fee2df55f33783bffbe63c7d8a879233d92f4cdb13503e7306acae70782	admin	2026-04-29 15:09:55.577448+00	2026-05-29 15:09:55.576+00
116	4e5579fb42c8c64285a4b2cd44283773d4e5572d4d92529d9bcc0ca12608886f	admin	2026-04-29 15:15:57.96446+00	2026-05-29 15:15:57.963+00
117	bba4fa220455e2bf909657f404f4a6490dc0c94de9c795860d11383d06236dfd	admin	2026-04-29 15:30:58.354693+00	2026-05-29 15:30:58.354+00
118	b3b2191433e7a817f482a2d2836687b5e623a27dfba274b149b413601a80e5fc	admin	2026-04-29 15:35:26.72785+00	2026-05-29 15:35:26.726+00
119	008829203cb0922b49fafa3348b468321f87ec5ef61a68a52ae9c21273ff9a3d	admin	2026-04-29 15:58:11.43028+00	2026-05-29 15:58:11.429+00
120	361e74d815d68784e3b584e6fb613b2e5c4c23106b076af0b7f065e33b8eaa50	admin	2026-04-29 16:02:49.880179+00	2026-05-29 16:02:49.879+00
121	516717f24d623560a97a095fef4093987c22a3324cdf164adabceab0e13d412c	admin	2026-04-29 16:07:45.782539+00	2026-05-29 16:07:45.781+00
122	4e90f542b83957df1a3ba6e0d046fe762b05e2b7c642d31c5b4c6074607c9f75	admin	2026-04-29 16:14:12.862291+00	2026-05-29 16:14:12.861+00
123	bd6691f40edb6b3d772cecbb38026a8ebb4fd1f8f71a49fe2c1cccf5604b084a	admin	2026-04-29 16:18:40.356157+00	2026-05-29 16:18:40.355+00
124	d36e3e2b1520752704a54007e24a5d3a93456fd1f4310f6c47585acc4d60d532	admin	2026-04-29 16:20:23.66848+00	2026-05-29 16:20:23.667+00
125	348dde3662929b214fe613c6fd06d73b7c01761b6ae717ffa0452861a7c2dafe	admin	2026-04-29 16:25:20.996708+00	2026-05-29 16:25:20.995+00
126	5d340ee21a86ed5feb3a1479e1f6a627772e2ef196764df574828b2545342e03	admin	2026-04-30 08:28:06.278695+00	2026-05-30 08:28:06.277+00
127	daf18255f419a84a87407a5c12987eb8f30e1460afef2c654f0c3faf4ccce86d	admin	2026-04-30 08:34:52.167918+00	2026-05-30 08:34:52.167+00
128	0ea750b06f239cfa81de2263c15f679259711333b8d3afe916e715de3f44558f	admin	2026-04-30 09:24:40.621466+00	2026-05-30 09:24:40.62+00
129	a8092fc6aa2330980cff545ddf77753ebe78e73fa4080458ee0e18c2ff35af65	admin	2026-05-01 00:39:03.399601+00	2026-05-31 00:39:03.398+00
130	5bd918748fe5aebfcd20a955b8aad82a466b5e956e3ce1337746efd1571130d3	admin	2026-05-01 01:03:27.597215+00	2026-05-31 01:03:27.596+00
131	95a0a11326da78381eab3f1d5092b3acff0dff75ee1985fb1ec352dd46110062	admin	2026-05-01 09:06:13.688646+00	2026-05-31 09:06:13.687+00
132	1ecc00b399c17cd8a4c49a3f6c27bf1a04af4380ac770315906edff908a7d2b5	admin	2026-05-01 09:14:49.019453+00	2026-05-31 09:14:49.018+00
133	904630399bc573287e545bc1a1fa65f12fb68021e3b36542ba436ebfb922ebce	admin	2026-05-01 09:26:52.270149+00	2026-05-31 09:26:52.269+00
134	43a2f97993a7d23d2f8087f15c5ec38ef9ca66cc4517c65907a83ec9017a9f91	admin	2026-05-01 09:27:37.466275+00	2026-05-31 09:27:37.465+00
135	960c5fdc966667e9525185b00006ceb8e7ad87b76c19cb4d529eca432a2e5fd0	admin	2026-05-01 09:30:25.172793+00	2026-05-31 09:30:25.172+00
136	729964dfa37d98e969aa784adf345e840df0e159a82dae5a5c008846b96e4b24	admin	2026-05-01 09:34:47.6812+00	2026-05-31 09:34:47.68+00
137	2f029fbbf27b0cd996691dd666cc17826702e1ddeb525e34c681cc8a04cd18a8	admin	2026-05-01 12:38:17.648577+00	2026-05-31 12:38:17.647+00
138	c4949e5e684de63e4f575ac85e153e4101208c5e3990b08f5d505ccbb0c92cab	admin	2026-05-01 12:41:11.114707+00	2026-05-31 12:41:11.114+00
139	8ff6df55a4126a8054b2dc894278b0e0ce49ae1b692781baa544736b992794b6	admin	2026-05-01 15:06:56.585445+00	2026-05-31 15:06:56.584+00
140	0c3266e89ffa39e64acd7542a4a66a8005e7956053bca8cf09f3a932a14e8062	admin	2026-05-02 13:22:22.483766+00	2026-06-01 13:22:22.483+00
141	a0432a57f25e6b4d6411e27f4c149aca02994da110c611006e9372b218467075	admin	2026-05-02 13:23:38.526033+00	2026-06-01 13:23:38.525+00
142	80cb224eb5d42dcd446f2d26bb9d752fd5f5985f18c185ce5353ac2bf1d6dca9	admin	2026-05-02 13:43:55.923217+00	2026-06-01 13:43:55.922+00
143	1414dc94380efab28338f1055e286598fddad1a41196db406870601aa9449ca7	admin	2026-05-02 14:16:13.895403+00	2026-06-01 14:16:13.894+00
144	0432f0b25024bca40fb1958ec0d12f46da852386ed327553fba3adb5a4187e99	admin	2026-05-02 14:18:51.675005+00	2026-06-01 14:18:51.674+00
145	c66ccc4aafe8fdc9d78410fc07849baaa3d6a3072a7d55933ce49f946859fba7	admin	2026-05-02 14:30:09.479623+00	2026-06-01 14:30:09.478+00
146	e6bbce97bdaae317a846c1e7fbd0bea9564d2fac0b0e6948f9ecc693c958b206	admin	2026-05-02 14:40:58.402322+00	2026-06-01 14:40:58.401+00
147	56f19acfac242b2fa184b5a2bb0439cd702722257305373715a1542887e97892	admin	2026-05-02 14:43:00.490073+00	2026-06-01 14:43:00.489+00
148	5a7cf9143b7fd23239a74cc2cf5756982607c35c85a5fcb2a5f0ce06897f3511	admin	2026-05-02 14:47:38.235099+00	2026-06-01 14:47:38.234+00
149	0fdd069b5b5febd89335e948cdf50285b260258cbdf35462549a4e0fd1184664	admin	2026-05-02 14:53:48.27864+00	2026-06-01 14:53:48.277+00
150	7082e6bdf4fca50b943d694e9de06288071b13b50f5a2d4ff7cd08049f132cf5	admin	2026-05-02 14:56:51.622745+00	2026-06-01 14:56:51.622+00
151	031bef184b9c7ae2afd8e8b5b40600221423b679fb6af9deaf621b2c77e9049f	admin	2026-05-02 15:13:54.043153+00	2026-06-01 15:13:54.042+00
152	b40f14aaa452f272c0f1a13f25a3307a4af313343eca63dd17638983b718be42	admin	2026-05-02 15:17:48.707374+00	2026-06-01 15:17:48.706+00
153	7e08afb0014fc6c782ec736eba80b8dc541422ada1337da18f878725daea7bd0	admin	2026-05-02 15:24:36.754953+00	2026-06-01 15:24:36.754+00
154	a733b40510dee1b8dcac8d6a27bc2100b267fc972505764b81f9c24e3fee0c12	admin	2026-05-02 15:27:37.419141+00	2026-06-01 15:27:37.418+00
155	d3940a21969000d95692c2463091ddaa946578bc3d69f28073dab549871e8f64	admin	2026-05-02 15:37:06.263167+00	2026-06-01 15:37:06.262+00
156	d0a4b93e64d7313e3e6e4514ed74298c42c5be7566bdd48392e66065981d1b49	admin	2026-05-02 15:43:01.162844+00	2026-06-01 15:43:01.162+00
157	1e7ff784bc878872160c2df1923ed97ce41728a92e71bfe15bd2a8b1c3d90d29	admin	2026-05-02 15:44:33.445838+00	2026-06-01 15:44:33.445+00
158	edff2f5c38da95fc8645f87035b91ab7fdbcdcedaf58bbd4cc1b779d6a995429	admin	2026-05-02 15:49:25.255701+00	2026-06-01 15:49:25.255+00
159	3e508237f78b9cf3c583f666c7728bf4f9c123397f33bf9d7cda0d174a5b06e9	admin	2026-05-02 15:53:55.094093+00	2026-06-01 15:53:55.093+00
160	caef2b2f1c011f9e363b4af709b64f611e46464bd0e18d19da9a55f921eb88af	admin	2026-05-02 16:10:24.928285+00	2026-06-01 16:10:24.926+00
161	0005ed67ad14d9e4e8940744485d5af293cc01a1b4f1a385f229190837b3fb62	admin	2026-05-03 08:08:52.75363+00	2026-06-02 08:08:52.752+00
162	9699f60da37f9e713f4b8ac530657f9a3a53dc93527d73e870a6da08674c30ee	admin	2026-05-03 08:17:13.025615+00	2026-06-02 08:17:13.024+00
163	864a529e203114c2d63d09decc3f984d4311666d646688fdf07577fe212eacad	admin	2026-05-03 08:22:45.951291+00	2026-06-02 08:22:45.95+00
164	ce0e05ce70e2077b8cf51b67438d6f903e346e7aa4fa081aa6f7c589801ca499	admin	2026-05-03 08:23:56.216216+00	2026-06-02 08:23:56.215+00
165	75f5444bb39d22898a14a90fc36864db3aedec1660bf219905fd9b4e6fd91c5f	admin	2026-05-03 08:25:59.293816+00	2026-06-02 08:25:59.293+00
166	66ec9b61c5f6e0e0bc28e4c885513875cd00bbe5bcd31b0c932372d3f349296a	admin	2026-05-03 08:35:47.817035+00	2026-06-02 08:35:47.816+00
167	9ee4ad74c190e012f6f80654798ded334757b3add2e1e1769c2c12cf1dc31ae8	admin	2026-05-03 08:38:22.4971+00	2026-06-02 08:38:22.495+00
168	93942a3c0d5dbcc63b90da2db7331eda4421a6199eb2e925ecb1ab56f0fc3359	admin	2026-05-03 08:48:23.410987+00	2026-06-02 08:48:23.41+00
169	36c5c9d7921abbcdcca0e08d5eb8b5b80e6e722f5ad14070548ba27f52d02c5d	admin	2026-05-03 08:59:43.756427+00	2026-06-02 08:59:43.755+00
170	1b4c2fdd3a9807aab1adf4f780aa9bf4949e6c9d31bd96818b19c2a03fdbfcc6	admin	2026-05-04 08:50:37.658105+00	2026-06-03 08:50:37.656+00
171	44dfbd66eae83af64794d33c4daea8f849b456f948a6368490f86a8f544f9d08	admin	2026-05-04 08:53:36.011455+00	2026-06-03 08:53:36.01+00
172	3b0205b3ec969fe3b13fbfc5abcb61c6f979a5227579b3aa902d6d13276b1e99	admin	2026-05-04 08:57:38.385435+00	2026-06-03 08:57:38.384+00
173	12e35992499f9d20b1617e01d58b0a81a1f8235a5353686325bf87e2ae9ce4ce	admin	2026-05-04 09:15:14.909691+00	2026-06-03 09:15:14.908+00
174	8367e248bc2c673ccd80ff0c0eab541566cfc9ad3d83cb90fceddf57b16b742a	admin	2026-05-04 09:22:14.45505+00	2026-06-03 09:22:14.454+00
175	0934f5c0bfb5201e3e0abe097d918aa8145055757355864e819ae53f05be8888	admin	2026-05-04 09:24:35.653088+00	2026-06-03 09:24:35.652+00
176	48bf2adf7f91d062f669a0338863403a3567d8be9aa8b8923502d515c36766c7	admin	2026-05-04 09:26:04.473658+00	2026-06-03 09:26:04.473+00
177	364d43a3064dc2a1edc6f3de3f67de36ef00e3e469509100ce99aa4f6a22ab69	admin	2026-05-04 09:31:24.805843+00	2026-06-03 09:31:24.804+00
178	941ef2ba355bf2e3a7bc7f244545566a9db3ee70dd08cb9cdc275aa16fa19134	admin	2026-05-04 09:33:00.555873+00	2026-06-03 09:33:00.555+00
179	6a3a24c190fe11d7bf2f40a32358649fb41f9429e2f2a0534ac0cb72f213ddcd	admin	2026-05-04 09:36:06.163622+00	2026-06-03 09:36:06.163+00
180	735f47a043bdafc9cd4919ac69f872965d0e06fb408775188163b8b77cec9a75	admin	2026-05-04 09:38:11.131581+00	2026-06-03 09:38:11.13+00
181	f8063ab560439b6a241cbb9b0c0a0980342f46a2d82cc19056e3718f4646d6de	admin	2026-05-04 09:42:59.523296+00	2026-06-03 09:42:59.522+00
182	47d5baf0b1ce54caa3f9dfa50670be1e18a9bbd5ed798ca946826b7b70b1f91f	admin	2026-05-04 10:19:25.036942+00	2026-06-03 10:19:25.036+00
183	31ed642643f36f5e94946cd89c9c7eb763b0df3316358dba7b5fa7ca1a255edc	admin	2026-05-04 13:47:20.411652+00	2026-06-03 13:47:20.41+00
184	43778e8e4594a73acd68acb14e4270c3f737c5b6443b4b34e18546bdf309e857	admin	2026-05-04 13:57:35.850259+00	2026-06-03 13:57:35.849+00
185	5b9354391417dba0152d482437cdd8562335d960987806163bb88f28c3d4a459	admin	2026-05-06 08:39:49.825939+00	2026-06-05 08:39:49.825+00
186	02173f9bc35ad37dfe125970ce41d46cf3eddc310918845c9ea293b2c4690466	admin	2026-05-06 08:43:15.597258+00	2026-06-05 08:43:15.596+00
187	06e955a54e82436a3dcfcbee4a9c2df05e04fcf48ac8cc83a3c0f23dbe78e9c0	admin	2026-05-06 08:45:59.868032+00	2026-06-05 08:45:59.867+00
188	63854afa145256a5c97eff4efeb9fbaaeedb2722b48e0dd50b7e405eb943e260	admin	2026-05-06 08:49:09.921246+00	2026-06-05 08:49:09.92+00
189	32092925e1da54f01ad23e9f286338ed8342a12b1bc4707fbbd466f4e26f5536	admin	2026-05-06 08:51:39.635329+00	2026-06-05 08:51:39.634+00
190	5e6844e41edbd2ddd40e1cb9fb6af9c9f899842f5fd1ee274f1d7405f43628ba	admin	2026-05-06 08:59:41.532997+00	2026-06-05 08:59:41.532+00
191	3500e8f87a85f7c7e61839e18e7643374755a5fe19cd8a0d4f4a4b9cca76c562	admin	2026-05-06 09:00:29.324778+00	2026-06-05 09:00:29.324+00
192	5210e49c323f47f8cde5285b76d7851326c2f9b28d3dd6181f7204694cad5a27	admin	2026-05-06 09:02:19.087034+00	2026-06-05 09:02:19.086+00
193	9b7b5b6f06709a44c1d645b1fef3b1cb6f166073a04af25bdcf4dde51ffaca0b	admin	2026-05-06 09:03:34.437067+00	2026-06-05 09:03:34.436+00
194	1d388557c080c5953caec02cb7bd406e1c0745589148b7b65bb042d7a1819eb5	admin	2026-05-06 09:04:36.96922+00	2026-06-05 09:04:36.968+00
195	6ec08001c0e8e1fe83271f112f39dfefe3e0f2c3cd2efca44e1f4b8a5cefb954	admin	2026-05-06 09:05:54.258687+00	2026-06-05 09:05:54.258+00
196	8a2c8015e10ad7c5e620df2ac0c115a3012d6aefd610aeef38cca58ef726d70e	admin	2026-05-06 09:10:24.970905+00	2026-06-05 09:10:24.97+00
197	71c658e5bd05aee5684fd5fcc9a488846161098f655a53c4d68de33f8513a4de	admin	2026-05-06 09:12:36.228386+00	2026-06-05 09:12:36.227+00
198	98a853ac7a626c1d849abfb48f0b1a205663e12c567d7eda6153eb71ffa53fae	admin	2026-05-06 09:16:44.38464+00	2026-06-05 09:16:44.384+00
199	ffcd1f0a23333ddcbbfa810becf289d101d0cf3db4818567eae27e1afc4e6cf5	admin	2026-05-06 09:25:33.200837+00	2026-06-05 09:25:33.2+00
200	7b287d49efb62cbb76e325e1036bd79d22c9fbd71d0047d9dbda8f8caa49e310	admin	2026-05-06 09:27:05.754905+00	2026-06-05 09:27:05.754+00
201	e97c3d1442068ff6233259a4a7209566c91f68c639a8c94922512fddb7e5d6e6	admin	2026-05-06 09:38:57.90444+00	2026-06-05 09:38:57.904+00
202	0cde451f3c6db2799a724f8bfe860bcc227122500410331c8068b1031fb423c0	admin	2026-05-06 09:46:14.012664+00	2026-06-05 09:46:14.012+00
203	152ce55687ce1d546403a3e970b3b44d672b76d72dbbd6f29881a56518022c23	admin	2026-05-06 09:50:36.577356+00	2026-06-05 09:50:36.576+00
204	702c468a1d240de1a74d1ff37ea7cb482817ff2f8a297bfe1087e8aef339d1e8	admin	2026-05-06 09:54:39.166279+00	2026-06-05 09:54:39.165+00
205	3017cb6dc7cfbeac72b7d8b7710992dfc994dcee6c76d4eb8e1fabb6fce12ee1	admin	2026-05-06 09:58:18.39009+00	2026-06-05 09:58:18.389+00
206	7973825d511e257173f5c76b057fa2776ed0ba108e80fe1c05f70783487c7460	admin	2026-05-06 10:02:40.516447+00	2026-06-05 10:02:40.516+00
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, username, password_hash, created_at, updated_at) FROM stdin;
1	admin	$2b$10$S7cDEMLQlfXgHQou92e9NugzubXqCHED3unpTYh6/f9hSksw4sH06	2026-04-24 09:28:14.022928+00	2026-04-24 10:06:14.903732+00
\.


--
-- Data for Name: consultations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultations (id, customer_name, phone, soil_type, crop, problem, status, created_at) FROM stdin;
1	anifeg wafa	0658749317	sandy	طماطم	جفاف التربة	new	2026-04-23 15:31:10.783783+00
2	mimi nouredin	765765747647	sandy	طماطم	htffhgffhfhhgfhgfhfh	new	2026-04-27 09:29:33.790817+00
3	walid anifak	0658749317	silt	طماطم	dgdgfgdfgdgdfgfgdfgddf	new	2026-05-06 08:51:31.686445+00
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, customer_name, phone, message, is_read, admin_reply, created_at, session_id, customer_id, is_admin_initiated) FROM stdin;
4	kader chaili	\N	hello	t	hi	2026-04-28 09:32:58.29728+00	203e843d-d532-4000-8283-ea156e0208c5	2	f
5	kader chaili	\N	how are you	t	im good	2026-04-28 09:33:39.854376+00	203e843d-d532-4000-8283-ea156e0208c5	2	f
6	kader chaili	\N	how much ?	t	300	2026-04-28 10:19:35.366959+00	203e843d-d532-4000-8283-ea156e0208c5	2	f
7	kader chaili	\N	oh thank you	f	\N	2026-04-28 10:20:34.993764+00	203e843d-d532-4000-8283-ea156e0208c5	2	f
8	adam anifak	\N	good morning	t	hi	2026-04-28 10:22:31.126003+00	286db98e-69a2-47a0-ad78-4868231f055a	3	f
9	adam anifak	\N	everythinh is good	f	\N	2026-04-28 10:23:12.906484+00	286db98e-69a2-47a0-ad78-4868231f055a	3	f
10	فريد بوعلام	0551234567	مرحباً، رابط دورتك جاهز:\nhttps://meet.google.com/test-abc\nفريق Vermifert	f	\N	2026-04-28 15:32:57.235735+00	\N	1	t
11	adam anifak	0765543445	مرحباً adam anifak،\nيسعدنا إخبارك بأن رابط دورتك جاهز:\nhttps://meet.google.com/abc-defg-hij\nفريق Vermifert	f	\N	2026-04-28 15:36:08.443301+00	\N	3	t
12	adam anifak	0765543445	مرحباً adam anifak،\nيسعدنا إخبارك بأن رابط دورتك جاهز:\nhttps://meet.google.com/abc-defg-hij\nفريق Vermifert	f	\N	2026-04-28 15:44:25.618444+00	\N	3	t
13	milloud malahi	\N	do you have liquid soil ?	t	yes we do	2026-04-29 09:27:52.634007+00	f7f2711f-692f-408f-a30b-4e183d4d54bd	\N	f
14	walid anifak	\N	إنتاج التربة ضعيف	t	salam	2026-05-06 08:48:46.284485+00	608b31e6-08d0-433e-b60d-088adb06e8f8	\N	f
15	abdo tejini	6575765757576	مرحباً abdo tejini،\nيسعدنا إخبارك بأن رابط دورتك جاهز:\nhttps://www.zoom.com/en/products/virtual-meetings/?ampDeviceId=1e23f8d4-8723-4a47-a1de-c38f1fa9f9a3&ampSessionId=1778058781674\nفريق Vermifert	f	\N	2026-05-06 09:14:08.436152+00	\N	7	t
16	abdo tejini	\N	how many days	t	2 days \n20 $	2026-05-06 09:16:38.935542+00	82778b8c-d876-4e04-ab9b-21ce1e57710c	7	f
17	abdo tejini	6575765757576	مرحباً abdo tejini،\nيسعدنا إخبارك بأن رابط دورتك جاهز:\nhttps://www.zoom.com/\nفريق Vermifert	f	\N	2026-05-06 10:00:18.220819+00	\N	7	t
18	abdo tejini	\N	salam	t	sbah el khir	2026-05-06 10:02:33.505838+00	82778b8c-d876-4e04-ab9b-21ce1e57710c	7	f
\.


--
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_enrollments (id, customer_name, phone, course_id, status, created_at, training_link, message_sent_at) FROM stdin;
3	echaima boussadi	4324234234234	beginner	confirmed	2026-04-28 15:17:10.226342+00	https://meet.google.com/abc-defg-hij	\N
1	Test User	0555123456	beginner	confirmed	2026-04-28 14:58:52.032403+00	\N	\N
2	walid madridi	65765675765757	beginner	confirmed	2026-04-28 15:02:13.903263+00	https://meet.google.com/abc-defg-hij	2026-04-28 15:42:04.566+00
4	adam anifak	0765543445	beginner	confirmed	2026-04-28 15:27:07.155805+00	https://meet.google.com/abc-defg-hij	2026-04-28 15:44:25.846+00
5	kamal kam	5765657576575	beginner	new	2026-04-29 08:55:20.526744+00	\N	\N
6	abdo tejini	6575765757576	beginner	new	2026-05-06 09:12:27.047397+00	https://www.zoom.com/en/products/virtual-meetings/?ampDeviceId=1e23f8d4-8723-4a47-a1de-c38f1fa9f9a3&ampSessionId=1778058781674	2026-05-06 09:14:08.649+00
7	abdo tejini	6575765757576	beginner	new	2026-05-06 09:58:04.563861+00	https://www.zoom.com/	2026-05-06 10:00:18.413+00
\.


--
-- Data for Name: customer_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_sessions (id, customer_id, token, expires_at, created_at) FROM stdin;
1	1	a16d36555ca9e1539125255c377942ca2bd27e1c8e01e19dcdbb509541c25d94	2026-05-24 15:44:17.76+00	2026-04-24 15:44:17.761455+00
26	2	59d4ad69a6ad3ea26a315c0a9534e1ee42920dee06268c8d01eb993c579b8d87	2026-05-28 09:47:03.888+00	2026-04-28 09:47:03.888783+00
27	2	291e59447397fb25a6e064ad2d5b7646aed700362477834281b76a994f7ab9a0	2026-05-28 09:47:48.085+00	2026-04-28 09:47:48.086147+00
42	2	4ae3d60735b4664d2c7e34c56745c44c889901c670bc89a965e8dafcb1561611	2026-05-31 14:31:32.527+00	2026-05-01 14:31:32.528472+00
46	2	ddc77d0d7887137f425a85cc48a3b3c0dae9dd133b2d13df5b5b2f1a8aa3d014	2026-05-01 16:02:40.686+00	2026-05-01 15:02:45.876554+00
60	7	46743a663895816ef022f7eb7fa6b3183214c59aca45828b8f1c1e9dcd794382	2026-06-05 08:57:03.484+00	2026-05-06 08:57:03.484406+00
61	8	ecc85791a4c5699e6030ebd7bb89abb34a654199049f79be6d96d3cbadb72996	2026-06-05 10:11:51.618+00	2026-05-06 10:11:51.618865+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, password_hash, created_at, is_blocked, referral_code, referred_by_id) FROM stdin;
1	فريد بوعلام	farid@test.dz	0551234567	$2b$10$TDbUFWEdMASygIXXoYOePOVTi8zVoILdQdCgERWJb4dBQo76XOEOi	2026-04-24 15:44:17.666375+00	f	REF9FA2AE7F	\N
3	adam anifak	adam2000@gmail.com	0765543445	$2b$10$7JBg2TDU2FQh5uv6KXOlXehP6cfNXHRW3knQI6bhN/LomQ4PccoL2	2026-04-25 08:54:41.531387+00	f	REFF00F6C30	\N
2	kader chaili	kader1990@gmail.com	0678980987	$2b$10$EClJtlphFPP1sdxnlqr3.Oafk45j2AL/Bbg1h49o/FkdBRlnKC4VW	2026-04-24 19:58:53.541134+00	f	REF2B86FBE4	\N
4	bilal boussaadi	bilal2026@gmail.com	0657613345	$2b$10$MYQMVA12nPnA/Mp2r6cMGetiUOwU0rvQIfXbQ5ptm6tt9QuJB1lIS	2026-05-01 14:37:30.288001+00	f	REF3462696C	\N
5	salima anifeg	salima@gmail.com	4564654646	$2b$10$1j.F.DKwpjpdoYhHRf6OT.l4Kt6vSNPn0DyTBTJtXJbrgjRY7xPle	2026-05-02 13:20:00.163445+00	f	REF3573616C	\N
6	wafa anifeg	wafa@gmail.com	4327635475247527	$2b$10$iLAxOrtFQxIAu.3il/cKKe7rvgGLTnKUaSHiQ7DJtao6zBpL0tm1u	2026-05-03 08:45:14.369175+00	f	REF36776166	\N
7	abdo tejini	abdo@gmail.com	6575765757576	$2b$10$is4Yw0XMLJFl5gcLtKdVHOvGl.9.CL79cDr4.zAEQrBCAJX7axcSq	2026-05-06 08:57:03.470531+00	f	REF37616264	\N
8	mimi nouredin	mimi@gmail.com	2342342342342	$2b$10$TbPJJggOCT0b1s/eL7Vcsua9AcCHRruFgVpRdSieClVHSpXzcGEd2	2026-05-06 10:11:51.593801+00	f	REF386D696D	\N
\.


--
-- Data for Name: delivery_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_sessions (id, token, user_id, created_at, expires_at) FROM stdin;
11	60d12599b16772eca9e52764586d788304ffc304c16001ab0eb5ae92adf2a180	1	2026-04-24 13:53:20.637482+00	2026-05-24 13:53:20.637+00
13	1ff11799bfef3c2e6ee6d37954a272fb0f33c1ae3f103b44192b23a30f5d4a44	1	2026-04-24 15:23:47.159836+00	2026-05-24 15:23:47.159+00
17	cead9e749833e309f50b3aa043f3552914f8412d2c7d98a7868ecc87e8a3b3be	5	2026-04-24 15:31:46.567724+00	2026-05-24 15:31:46.567+00
19	6be3cd1794f35787d71f9e2736918e53da06f1d7be98c49a92f07eb70dc73c99	6	2026-04-25 08:50:40.620206+00	2026-05-25 08:50:40.619+00
23	83fa42e6b9540ef9fcd55b5ec754afb7ca741d3fb8dd657d7eccb25a6d4a86c3	3	2026-04-25 09:19:25.461633+00	2026-05-25 09:19:25.461+00
27	c0fa85e723cc6fedd0944f983f5f942a408ea54bd7c753c43238772b94e61749	6	2026-04-27 09:12:36.580033+00	2026-05-27 09:12:36.579+00
28	96e4285453209b2877587fde0837064397d4e75cd360a3ea772a26131177eb6b	6	2026-04-27 09:13:24.286814+00	2026-05-27 09:13:24.286+00
29	7a831fd67f56d318aae1fddf173a6b83695b4d3e3a23106c4c3772fca474677b	6	2026-04-27 09:17:18.850125+00	2026-05-27 09:17:18.849+00
30	5d4d45ca636af0c8633b08c4843f8ac660195ed99073d1d1f4e5a61ab17d8f25	6	2026-04-27 09:18:08.474736+00	2026-05-27 09:18:08.474+00
31	e6cf07af54cf6f7f61b72a0d189a213a5a572aa1abdf1f56639d501c47b5842e	3	2026-04-27 09:42:27.456776+00	2026-05-27 09:42:27.456+00
32	d196b2cb432fa8a48f34b795fa3468374a650b9a8b1e9e6c843992656bc954a8	3	2026-04-27 09:43:31.035395+00	2026-05-27 09:43:31.034+00
33	d7a214a61e242d605c06361af93601fa9ee17f32ce7eeb93e5bef9fa7270b236	7	2026-04-27 19:40:54.386834+00	2026-05-27 19:40:54.386+00
35	dac9c0f4342580fe8f1f427343ccb5644cbe62409cad291bd5fe70bf708b8908	4	2026-04-27 19:44:57.987991+00	2026-05-27 19:44:57.987+00
36	b8a45a6f29360d2370a66a807d532ae88107ce772150acb4008c8f36baac3cfa	6	2026-04-28 00:43:25.512463+00	2026-05-28 00:43:25.511+00
38	4c480878413409ac79f06e8491293c0a14a7ff138336809fb7b6fb14cfffc303	6	2026-04-28 00:51:45.407843+00	2026-05-28 00:51:45.407+00
40	6afcf12308cb37c934bf2c45f1b3ebffdbe12c85fe6612bfc0cf73bd476491ba	5	2026-04-28 10:25:54.170254+00	2026-05-28 10:25:54.169+00
42	14ba5e518d2c0352c8372828f6519fe780c2d0135d08dd0ecafbdb5fb4d2892b	7	2026-04-28 10:58:24.682842+00	2026-05-28 10:58:24.682+00
44	f06a29c45f4c8544b58becea7d61b929bcf6ca7dcb98a2fd1a676428c8dd554c	7	2026-04-28 13:57:50.37744+00	2026-05-28 13:57:50.376+00
46	8e2c118d8306f18460da39ea769bbaf9093044434a52668f3e334af4496ac34d	5	2026-04-29 08:57:55.784477+00	2026-05-29 08:57:55.783+00
47	b3bb169830922ca49e8122db59661c7faf7cbe89e929d6204f5b476cce9c917d	5	2026-04-29 09:15:36.747047+00	2026-05-29 09:15:36.746+00
54	48170f47a5e48c0c1a1408b225a955298a0aac8b621eebba694bfec8c835cae0	5	2026-05-06 09:48:16.14995+00	2026-06-05 09:48:16.149+00
\.


--
-- Data for Name: delivery_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_users (id, username, password_hash, name, phone, role, active, created_at, available, blocked_reason) FROM stdin;
8	company_rapid	$2b$10$C7TX8i...rqG1YrkGZdDgOvevBB3PjqZ..i8uo9YCpPFAsGFftwBe	شركة رابيد للتوصيل	0231234601	company	t	2026-04-24 13:01:06.829407+00	t	\N
2	walid	$2b$10$5dAiRec/OIajRnrmrczIRu2G07kGurqYVxTdWeMuChImGzMqiPPfi	fast-delivery	0670206444	company	t	2026-04-24 12:37:08.972067+00	t	\N
9	company_express	$2b$10$bAMJleD7IuzdsYj59cpf8eaV/S8aREt/cpLj/n.hsJAletQZadZni	الجزائر إكسبريس	0231234602	company	t	2026-04-24 13:01:07.04629+00	t	\N
3	driver_ali	$2b$10$08nt3LYXHSRAfLSYiEn/gexNluYUJwM5vVnx4SjhOKcC12NzNBZYm	علي بن عمر	0551234599	driver	t	2026-04-24 13:01:06.016846+00	t	\N
1	mouh	$2b$10$RCcO8BVzmpmTD9QdA1D3.O5V1BH9qNC0tVUw8IcFg2Yn4DDl.zvki	mohamed ben		driver	t	2026-04-24 12:35:59.466354+00	t	\N
7	driver_farid	$2b$10$BvrIJVWfBRBTnR4/dT3zf.plwHUKSnLiSSKxUFWPoYuVIa8G4KBCC	فريد حمداني	0551234505	driver	t	2026-04-24 13:01:06.681727+00	t	\N
4	driver_karim	$2b$10$UZaUoEcB.frpaZnnJoIb1.ZUMmYDdHHea4R.JLJKV8zWVfOxBja32	كريم مزياني	0551234502	driver	t	2026-04-24 13:01:06.156567+00	f	\N
6	driver_nabil	$2b$10$B5ZNM32AvFWseicI05mxruQsl6SpnYnaF5BrasTjonvo/6qlmy6ny	نبيل صادق	0551234504	driver	t	2026-04-24 13:01:06.444851+00	t	\N
5	driver_yacine	$2b$10$bUeOqQoc2YtRTZDp/28WrunxXj4yYmoJHVuAltKjjyaq0jBPV8U8K	ياسين بوعلام	0551234503	driver	t	2026-04-24 13:01:06.298373+00	t	\N
\.


--
-- Data for Name: discount_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discount_codes (id, donor_id, code, discount_percent, points_used, used, used_at, created_at, customer_id, source, expires_at) FROM stdin;
1	3	VERDE-W00G8B	20	200	f	\N	2026-04-30 08:27:08.945799+00	\N	donor_points	\N
2	3	VERDE-OA1G20	10	100	f	\N	2026-04-30 08:27:34.138751+00	\N	donor_points	\N
3	\N	WELCOME-36C84A9B	10	0	f	\N	2026-05-01 14:37:30.324081+00	4	referral_joinee	2026-06-30 14:37:30.323+00
4	\N	FRIEND-D3D4071D	15	0	t	2026-05-01 14:49:27.30868+00	2026-05-01 14:37:30.328568+00	2	referral_referrer	2026-06-30 14:37:30.328+00
5	\N	REV-27C986SI	10	0	f	\N	2026-05-01 14:53:13.800148+00	2	review_reward	2026-05-31 14:53:09.202+00
6	\N	REV-HGRHIOU5	10	0	f	\N	2026-05-01 15:01:12.095674+00	2	review_reward	2026-05-31 15:01:07.452+00
7	\N	REV-6SBQSHWZ	10	0	f	\N	2026-05-01 15:01:16.581543+00	2	review_reward	2026-05-31 15:01:07.452+00
8	\N	REV-EB89DFE9	10	0	f	\N	2026-05-01 15:08:16.551163+00	4	review_reward	2026-05-31 15:08:16.55+00
9	\N	REV-01F93825	10	0	t	2026-05-06 10:07:48.64456+00	2026-05-06 10:05:18.753586+00	7	review_reward	2026-06-05 10:05:18.753+00
10	\N	WELCOME-4D22C05B	10	0	f	\N	2026-05-06 10:11:51.607009+00	8	referral_joinee	2026-07-05 10:11:51.606+00
11	\N	FRIEND-B15117AC	15	0	f	\N	2026-05-06 10:11:51.613054+00	7	referral_referrer	2026-07-05 10:11:51.612+00
12	\N	REV-EC62C040	10	0	f	\N	2026-05-06 10:12:45.533506+00	8	review_reward	2026-06-05 10:12:45.533+00
\.


--
-- Data for Name: donor_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donor_sessions (id, donor_id, token, created_at) FROM stdin;
1	1	c397ebc895c42c0ee77d7f1b5d77c8e295213a879e400eaab4c74461a36e85bf	2026-04-29 15:50:13.78389+00
\.


--
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donors (id, name, phone, password_hash, green_points, total_kg_donated, badge, created_at, username) FROM stdin;
1	فاطمة الزهراء	0612345678	1abde4fa49cef2880f74dde88c3c6c71b8c15c145bd24fd5476d90151a0dd0b7	0	0.00	seedling	2026-04-29 15:50:13.67704+00	\N
2	mansouri kamal	5466545646	99ab48d3410ae9f6cfaf63c7fcde73277c83f546e62e18ec1b70932862b63b10	0	0.00	seedling	2026-04-29 15:54:17.835061+00	\N
3	mansouri mohamed	4234242342	99ab48d3410ae9f6cfaf63c7fcde73277c83f546e62e18ec1b70932862b63b10	0	30.00	plant	2026-04-29 16:04:19.10241+00	mansouri
4	krimo chaway	65776667765	a86af6c27fbdb0d2cdff9877f59d19845752d5b5ff6d7157ac3c6c2de369b580	500	50.00	plant	2026-04-30 08:33:53.593934+00	krimo
\.


--
-- Data for Name: fertilizer_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fertilizer_batches (id, batch_code, source_type, source_description, nitrogen, phosphorus, potassium, organic_matter, production_date, notes, created_at) FROM stdin;
1	JZG8I38A	household	نفايات مطبخ ومزارع الخضروات	2.50	1.20	1.80	45.00	2026-04-29	\N	2026-04-29 09:43:10.721203+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, customer_name, phone, address, city, notes, product_id, product_name, unit_price, quantity, total_price, status, created_at, assigned_driver_id, assigned_driver_name, tracking_number, customer_id, requires_signature, proof_image, signature_image, delivered_at, discount_code_used, discount_amount, payment_method, chargily_checkout_id, payment_status, subscription_id, items_json) FROM stdin;
18	echaima boussadi	53463434	cite belkhirat mansour 	ksar el boukhari	a domicile 	6	بيو باور	750	2	1500	delivered	2026-04-27 19:38:53.977357+00	7	فريد حمداني	VF20261E2ABA	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
19	wa	654544446	sorecsud	keb		6	بيو باور	750	1	750	pending	2026-04-27 23:28:51.965676+00	\N	\N	VF2026DF6581	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
11	adam anifak	0765543445	cite mohamed boudiaf	ksar el boukhari	a domicile	6	بيو باور	750	1	750	delivered	2026-04-25 08:58:26.293414+00	4	كريم مزياني	VF20263879A8	3	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
10	adam anifak	0765543445	cite mohamed boudiaf	ksar el boukhari	a domicile	2	شاي الديدان السائل - 1 لتر	800	1	800	delivered	2026-04-25 08:56:02.486287+00	4	كريم مزياني	VF2026187BA6	3	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
12	asil anifak	0566743423	wlad hamza	ksar el boukhari	a domicile	1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	delivered	2026-04-25 09:17:31.187299+00	3	علي بن عمر	VF2026D3F184	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
22	أحمد بلعيد	0551234567	شارع زيغود يوسف، حي البدر، رقم 12	قسنطينة	الطابق الثاني	1	سماد الديدان الصلب	1500	2	3000	delivered	2026-04-28 00:42:38.324191+00	6	نبيل صادق	\N	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
13	amina chakchoukh	09866656655	sorecsud batiment 15	ksar el boukhari 	a domicile 	6	بيو باور	750	1	750	delivered	2026-04-27 08:43:26.123132+00	4	كريم مزياني	VF2026261919	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
14	abdelrahnman 	76576446554	zobra cite 500 	ksar el boukhari 	a domicile	1	سماد ديدان عضوي - كيس 5 كجم	1200	135	162000	pending	2026-04-27 08:53:13.024337+00	\N	\N	VF20264226A3	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
15	abdelrahnman 	76576446554	zobra cite 500 	ksar el boukhari 	a domicile	6	بيو باور	750	25	18750	pending	2026-04-27 08:53:13.249835+00	\N	\N	VF2026F47842	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
20	kamal kimari	34342425644	zobra cite 500	ksar el boukhari	a domicile	1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	shipped	2026-04-27 23:38:21.117054+00	5	ياسين بوعلام	VF2026DF065A	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
9	kader chaili	0678980987	blida cite2500	blida	a domicile	2	شاي الديدان السائل - 1 لتر	800	1	800	delivered	2026-04-24 20:44:37.473282+00	6	نبيل صادق	VF20267B7028	2	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
32	Test	0600000000	123 rue	Alger	\N	1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	pending	2026-05-01 09:10:46.80836+00	\N	\N	VF202689E825	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
16	LANABI MAYMOUNA	7654654654646	OXFORD 	NEW YORK	AT HOME 	1	سماد ديدان عضوي - كيس 5 كجم	1200	2	2400	delivered	2026-04-27 09:04:00.744868+00	6	نبيل صادق	VF2026F73C9C	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
23	adam anifak	0765543445	lyce boudiaf	ksar el boukhari 	a domicile	6	بيو باور	750	1	750	delivered	2026-04-28 10:44:57.530659+00	7	فريد حمداني	VF2026275B48	3	f	\N	\N	2026-04-28 13:58:07.607+00	\N	0	cod	\N	pending	\N	\N
17	kader chaili	64665464546	saneg	saneg	a domcile	6	بيو باور	750	1	750	delivered	2026-04-27 09:33:43.253939+00	3	علي بن عمر	VF2026E0A7BC	\N	f	\N	\N	\N	\N	0	cod	\N	pending	\N	\N
33	Test	0600000000	123 rue	Alger	\N	1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	pending	2026-05-01 09:10:53.258439+00	\N	\N	VF20269D3D10	\N	f	\N	\N	\N	\N	0	online	01kqhcw8z54p5yjqczs35ddt63	awaiting	\N	\N
41	kader chaili	0678980987	chelalt el 3dawra	magino		1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1020	pending	2026-05-01 14:49:27.294636+00	\N	\N	VF202697DF7F	2	t	\N	\N	\N	FRIEND-D3D4071D	180	online	01kqj086v139n8b05rxv6n0643	awaiting	\N	\N
24	adam anifak	0765543445	romanat 550 st	ksar el boukhari 	a domicile	6	بيو باور	750	1	750	delivered	2026-04-28 13:59:24.59825+00	6	نبيل صادق	VF2026EC5F96	3	t	\N	data:image/png;base64,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	2026-04-28 14:01:41.616+00	\N	0	cod	\N	pending	\N	\N
36	kader chaili	0678980987	13 marion apt 2l	jersey city	a domicile	2	شاي الديدان السائل - 1 لتر	800	1	800	pending	2026-05-01 09:28:58.817701+00	\N	\N	VF2026627308	2	f	\N	\N	\N	\N	0	online	01kqhdxczkr4sh3mce5bw9x2va	awaiting	\N	\N
37	echaima boussadi	0678980987	13 marion apt 2l	jersey city	a domicile	2	شاي الديدان السائل - 1 لتر	800	1	800	delivered	2026-05-01 12:36:37.184625+00	7	فريد حمداني	VF2026E8D639	\N	t	\N	data:image/png;base64,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	2026-05-01 12:42:01.89+00	\N	0	online	01kqhrmzn7hscs496av1btmtrq	awaiting	\N	\N
38	bilal boussaadi	0657613345	chelalt el 3dawra	magino		1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	pending	2026-05-01 14:39:29.352317+00	\N	\N	VF2026BED14C	4	f	\N	\N	\N	\N	0	online	01kqhznyz7gfbza45n4spy7s6c	awaiting	\N	\N
39	kader chaili	0678980987	chelalt el 3dawra	magino		3	سماد ديدان فاخر - كيس 10 كجم	2200	1	2200	pending	2026-05-01 14:41:44.494756+00	\N	\N	VF2026B2C21B	2	f	\N	\N	\N	\N	0	online	01kqhzt2taegmadb92cvg6np22	awaiting	\N	\N
40	kader chaili	0678980987	chelalt el 3dawra	magino		1	سماد ديدان عضوي - كيس 5 كجم	1200	1	1200	pending	2026-05-01 14:47:41.080122+00	\N	\N	VF2026727363	2	t	\N	\N	\N	\N	0	online	01kqj04z6ghnm5300maqzkr2sx	awaiting	\N	\N
45	salima anifeg	4564654646	500 logemets	سعيدة	اشتراك شهري #3 | المحصول: البطيخ	\N	الصندوق الأخضر — ماي 2026	2500	1	2500	delivered	2026-05-02 14:50:37.762129+00	7	فريد حمداني	VF202652B41F89	5	f	\N	\N	2026-05-03 08:24:37.504734+00	\N	0	online	\N	paid	3	\N
46	bilal boussaadi	0657613345	rue 500 	تلمسان	اشتراك شهري #4 | المحصول: الخس	\N	الصندوق الأخضر — ماي 2026	2500	1	2500	delivered	2026-05-02 15:13:14.793158+00	6	نبيل صادق	VF2026483BCC81	4	f	\N	\N	2026-05-02 15:27:24.179+00	\N	0	online	\N	paid	4	\N
53	nour nihal	34242342	romanat	ksar el boukhari		\N	4 منتجات	4950	1	4950	delivered	2026-05-04 08:52:41.382371+00	7	فريد حمداني	VF202631B400	\N	t	\N	data:image/png;base64,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	2026-05-04 08:57:21.861+00	\N	0	online	01kqs313pq28arcq5gfjgeef9w	paid	\N	[{"productId":6,"productName":"بيو باور","unitPrice":750,"quantity":1,"lineTotal":750},{"productId":1,"productName":"سماد ديدان عضوي - كيس 5 كجم","unitPrice":1200,"quantity":1,"lineTotal":1200},{"productId":3,"productName":"سماد ديدان فاخر - كيس 10 كجم","unitPrice":2200,"quantity":1,"lineTotal":2200},{"productId":2,"productName":"شاي الديدان السائل - 1 لتر","unitPrice":800,"quantity":1,"lineTotal":800}]
49	wafa anifeg	4327635475247527	bni marad	البليدة	اشتراك شهري #5 | المحصول: الباذنجان	\N	صندوق الفلاح — ماي 2026	4500	1	4500	delivered	2026-05-03 08:47:34.020509+00	6	نبيل صادق	VF202647C722FE	6	f	\N	\N	2026-05-03 08:59:30.263+00	\N	0	online	\N	paid	5	\N
54	nihal anifeg	3234234234234	romanat	ksar el boukhari		\N	تربة زراعية عضوية محسّنة - كيس 20 كجم ×4	7200	1	7200	confirmed	2026-05-04 09:21:43.971006+00	\N	\N	VF2026F51895	\N	f	\N	\N	\N	\N	0	online	01kqs4p9d2hrg049ps3qt4c7hs	paid	\N	[{"productId":27,"productName":"تربة زراعية عضوية محسّنة - كيس 20 كجم","unitPrice":1800,"quantity":4,"lineTotal":7200}]
55	bilal boussaadi	0657613345	chelalt el 3dawra	magino		\N	سماد ديدان عضوي - عبوة 1 كجم ×10	4000	1	4000	confirmed	2026-05-04 09:25:39.347534+00	\N	\N	VF20265DF138	\N	t	\N	\N	\N	\N	0	online	01kqs4xf8mabghcxnv05c30j40	paid	\N	[{"productId":18,"productName":"سماد ديدان عضوي - عبوة 1 كجم","unitPrice":400,"quantity":10,"lineTotal":4000}]
59	habib khelifi	32434234234242	zobra 500 log	ksar el boukhari 	a domicile 	\N	2 منتجات	2200	1	2200	delivered	2026-05-06 08:37:44.402794+00	7	فريد حمداني	VF202622FF63	\N	t	\N	data:image/png;base64,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	2026-05-06 08:43:03.852+00	\N	0	online	01kqy6z65wnwewn2jq9h6fafk0	paid	\N	[{"productId":18,"productName":"سماد ديدان عضوي - عبوة 1 كجم","unitPrice":400,"quantity":1,"lineTotal":400},{"productId":27,"productName":"تربة زراعية عضوية محسّنة - كيس 20 كجم","unitPrice":1800,"quantity":1,"lineTotal":1800}]
56	fatma boussadi	234234234223	chelalt el 3dawra	magino		\N	بيو باور ×6	4500	1	4500	confirmed	2026-05-04 09:32:23.001047+00	\N	\N	VF2026F1FFEF	\N	t	\N	\N	\N	\N	0	online	01kqs59sewfrrvmp6hzgwm053e	paid	\N	[{"productId":6,"productName":"بيو باور","unitPrice":750,"quantity":6,"lineTotal":4500}]
57	isha9 boussadi	424234234234	chelalt el 3dawra	magino		\N	2 منتجات	7000	1	7000	confirmed	2026-05-04 09:36:49.423797+00	\N	\N	VF20264BE85F	\N	t	\N	\N	\N	\N	0	online	01kqs5hxh101e39p4y6z873mzx	paid	\N	[{"productId":16,"productName":"ديدان كاليفورنيا الحمراء - 500 غ","unitPrice":2500,"quantity":1,"lineTotal":2500},{"productId":17,"productName":"ديدان كاليفورنيا الحمراء - 1 كجم","unitPrice":4500,"quantity":1,"lineTotal":4500}]
58	nassira anifeg	5345345353453	chracchriya	medea		\N	بيرليت زراعي - كيس 5 لتر ×1	750	1	750	confirmed	2026-05-04 09:37:43.94954+00	\N	\N	VF2026D08AE6	\N	t	\N	\N	\N	\N	0	online	01kqs5kjtyh90j82dhq6tjkpyg	paid	\N	[{"productId":26,"productName":"بيرليت زراعي - كيس 5 لتر","unitPrice":750,"quantity":1,"lineTotal":750}]
60	walid anifak	4234234234234	zobra 500 log	ksar el boukhari 		\N	سماد ديدان عضوي - عبوة 1 كجم ×10	4000	1	4000	confirmed	2026-05-06 08:45:31.905785+00	\N	\N	VF2026AE9388	\N	t	\N	\N	\N	\N	0	online	01kqy7de7whr4db24zbmwx1605	paid	\N	[{"productId":18,"productName":"سماد ديدان عضوي - عبوة 1 كجم","unitPrice":400,"quantity":10,"lineTotal":4000}]
63	abdo tejini	6575765757576	zobra 500 log	ksar el boukhari 		\N	2 منتجات	63000	1	63000	delivered	2026-05-06 09:45:09.143492+00	5	ياسين بوعلام	VF20269E2F9B	7	t	\N	data:image/png;base64,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	2026-05-06 09:50:25.416+00	\N	0	online	01kqyatkq96meqkgj8w9yarze1	paid	\N	[{"productId":18,"productName":"سماد ديدان عضوي - عبوة 1 كجم","unitPrice":400,"quantity":70,"lineTotal":28000},{"productId":21,"productName":"شاي الديدان المركّز - 5 لتر","unitPrice":3500,"quantity":10,"lineTotal":35000}]
64	abdo tejini	6575765757576	cite 60 log	البويرة	اشتراك شهري #7 | المحصول: الخس	\N	الصندوق الأخضر — ماي 2026	2500	1	2500	confirmed	2026-05-06 09:54:20.049813+00	\N	\N	VF2026A89890FB	7	f	\N	\N	\N	\N	0	online	\N	paid	7	\N
62	abdo tejini	6575765757576	ksar el boukhari	المدية	اشتراك شهري #6 | المحصول: الفلفل	\N	صندوق الفلاح — ماي 2026	4500	1	4500	confirmed	2026-05-06 09:05:36.865246+00	\N	\N	VF2026673B75EF	7	f	\N	\N	\N	\N	0	online	\N	paid	6	\N
65	abdo tejini	6575765757576	romanat	ksar el boukhari		\N	شاي الديدان المركّز - 5 لتر ×1	3150	1	3150	confirmed	2026-05-06 10:07:48.608581+00	\N	\N	VF20262C87EA	7	t	\N	\N	\N	REV-01F93825	350	online	01kqyc43802d41jh10qxerqhqd	paid	\N	[{"productId":21,"productName":"شاي الديدان المركّز - 5 لتر","unitPrice":3500,"quantity":1,"lineTotal":3500}]
\.


--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_reviews (id, product_id, customer_id, customer_name, rating, comment, created_at, image_url) FROM stdin;
1	6	\N	walid madridi	5		2026-04-27 23:32:01.151613+00	\N
2	1	\N	kamal kimari	4	good quality	2026-04-27 23:39:12.748237+00	\N
3	6	3	adam anifak	4	same day delivery and good quality	2026-04-27 23:41:53.823591+00	\N
4	6	2	kader chaili	5	best product	2026-05-01 14:50:28.485685+00	\N
5	3	2	kader chaili	5	best product in algeria	2026-05-01 14:55:29.540595+00	\N
6	2	2	kader chaili	5	its best product	2026-05-01 14:57:23.689009+00	\N
7	2	4	bilal boussaadi	5	kujhghjgjhgjhgjhghj	2026-05-01 15:08:16.487159+00	\N
8	2	4	bilal boussaadi	5	jhkjhjhkjhjhkhkjhkhkhkhkhkjh	2026-05-01 15:09:04.689426+00	\N
9	27	7	abdo tejini	5	good quality	2026-05-06 10:05:18.657825+00	\N
10	27	8	mimi nouredin	5	best product	2026-05-06 10:12:45.485092+00	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, price, unit, weight_kg, image_url, stock, active, created_at, category) FROM stdin;
15	ديدان كاليفورنيا الحمراء - 250 غ	ديدان Eisenia fetida الحمراء النشيطة، مثالية للبدء في مشروع السماد المنزلي. تتكاثر بسرعة وتحوّل المخلفات العضوية إلى سماد عالي الجودة خلال أسابيع. تُشحن في علبة معبأة بتربة رطبة.	1400	علبة	0.25	/api/img/worms-250g.png	50	t	2026-05-04 09:04:44.333813+00	worms
1	سماد ديدان عضوي - كيس 5 كجم	سماد ديدان (Vermicompost) عضوي 100% غني بالعناصر الغذائية والميكروبات النافعة. مثالي للخضروات، الأشجار المثمرة والنباتات المنزلية. يحسن خصوبة التربة ويزيد المحصول دون مواد كيميائية.	1200	كيس	5	/api/img/solid-5kg.png	50	t	2026-04-23 14:57:16.119126+00	solid
2	شاي الديدان السائل - 1 لتر	سماد سائل مركّز مستخرج من سماد الديدان، يُخفف بالماء ويُرش على الأوراق أو يُسقى عند الجذور لنتائج فورية. ممتاز للنباتات الضعيفة والشتلات.	800	لتر	1	/api/img/liquid-tea-1l.png	30	t	2026-04-23 14:57:16.119126+00	liquid
3	سماد ديدان فاخر - كيس 10 كجم	كيس عائلي بحجم اقتصادي، نفس الجودة العالية، يكفي لحديقة منزلية كاملة أو حقل صغير. تعبئة محكمة وسهلة التخزين.	2200	كيس	10	/api/img/solid-10kg.png	25	t	2026-04-23 14:57:16.119126+00	solid
6	بيو باور	مادة مساعدة أنيونية	750	لتر	0.5	/api/uploads/4ee842a09e50161d5e7d2fef.jpg	94	t	2026-04-24 11:13:42.268865+00	liquid
16	ديدان كاليفورنيا الحمراء - 500 غ	كمية متوسطة مناسبة لمن يملك حاوية تسميد أو يريد تعزيز مزرعة قائمة. الديدان حية ونشيطة، قادرة على معالجة حتى 500 غ من المخلفات الغذائية يومياً.	2500	علبة	0.5	/api/img/worms-500g.png	29	t	2026-05-04 09:04:44.333813+00	worms
17	ديدان كاليفورنيا الحمراء - 1 كجم	الكمية المثلى لإطلاق مشروع سماد احترافي أو للمزارعين الراغبين في إنتاج السماد بكميات كبيرة. مناسبة لحوض بمساحة 60×40 سم على الأقل.	4500	علبة	1	/api/img/worms-1kg.png	19	t	2026-05-04 09:04:44.333813+00	worms
19	سماد ديدان للأشجار المثمرة - كيس 25 كجم	تركيبة مخصصة لأشجار الزيتون والحمضيات والنخيل وكل الأشجار المثمرة. مُعزَّز بالبوتاسيوم والفوسفور الطبيعيين لتعزيز الإثمار وتحسين جودة المحصول. الحجم المناسب للمزارع الصغيرة والمتوسطة.	4800	كيس	25	/api/img/solid-25kg.png	15	t	2026-05-04 09:04:44.333813+00	solid
20	سماد ديدان حبيبي - كيس 5 كجم	سماد ديدان مكبوس على شكل حبيبات سهلة التوزيع والتخزين. لا يسبب حرق الجذور، يناسب كل أنواع التربة الجزائرية (الطينية والرملية والكلسية). مثالي للخضروات الصيفية والبطاطا.	1500	كيس	5	/api/img/solid-5kg.png	40	t	2026-05-04 09:04:44.333813+00	solid
22	هيوميك أسيد سائل مركّز - 1 لتر	مستخرج طبيعي من سماد الديدان الناضج. يُحسّن استيعاب التربة للعناصر الغذائية ويُعزّز نمو الجذور والمقاومة للجفاف — مهم جداً في المناخ الجزائري الجاف. يُستخدم 2-5 مل لكل لتر ماء.	1100	قارورة	\N	/api/img/liquid-humic-1l.png	30	t	2026-05-04 09:04:44.333813+00	liquid
23	طقم بداية تربية الديدان المنزلية	كل ما تحتاجه في علبة واحدة: حاوية تهوية + 250 غ ديدان كاليفورنيا حية + فراش ليفي جاهز + دليل عربي مفصّل خطوة بخطوة. الهدية المثالية لعشاق الزراعة العضوية.	3200	طقم	\N	/api/img/kit-starter.png	20	t	2026-05-04 09:04:44.333813+00	kit
24	حاوية التسميد الحيوي - 40 لتر	حاوية تسميد منزلية من البلاستيك المعاد تدويره، مزوّدة بمنافذ تهوية وصنبور لتصريف السائل. سعة 40 لتر كافية لأسرة متوسطة (4-6 أفراد). سهلة التركيب والتنظيف، مقاومة للحرارة.	2800	حاوية	\N	/api/img/kit-bin-40l.png	15	t	2026-05-04 09:04:44.333813+00	kit
18	سماد ديدان عضوي - عبوة 1 كجم	العبوة الأصغر لعشاق النباتات المنزلية والشرفات. سماد ديدان 100% عضوي خالٍ من أي مواد كيميائية، غني بالبكتيريا النافعة والهيوميك أسيد. يكفي لـ 5-8 أصص كبيرة.	400	كيس	1	/api/img/solid-1kg.png	8	t	2026-05-04 09:04:44.333813+00	solid
21	شاي الديدان المركّز - 5 لتر	عبوة اقتصادية لأصحاب الحدائق والمزارعين. يُخفف 1/10 بالماء ويُستخدم رشاً أو سقياً. يُنشّط الحياة الميكروبية في التربة ويُقوّي مناعة النبات ضد الأمراض والآفات.	3500	قارورة	\N	/api/img/liquid-tea-5l.png	14	t	2026-05-04 09:04:44.333813+00	liquid
25	كوكوبيت (ألياف جوز الهند) - كيس 5 كجم	وسيط زراعي طبيعي مستخرج من قشر جوز الهند. يُستخدم فراشاً للديدان أو خلطاً مع التربة لتحسين التهوية والاحتفاظ بالماء. شائع في البيوت المحمية والزراعة المائية (Hydroponie).	950	كيس	5	/api/img/coco-coir.png	35	t	2026-05-04 09:04:44.333813+00	substrate
26	بيرليت زراعي - كيس 5 لتر	حبيبات بيرليت خفيفة الوزن تُضاف للتربة لتحسين التصريف ومنع الاختناق الجذري. ضرورية لخلطات الشتلات وتربة حاويات الديدان. لا تغير درجة الحموضة، آمنة وطبيعية.	750	كيس	\N	/api/img/perlite.png	49	t	2026-05-04 09:04:44.333813+00	substrate
27	تربة زراعية عضوية محسّنة - كيس 20 كجم	خلطة احترافية جاهزة للاستخدام: تربة طبيعية + سماد ديدان + كوكوبيت + بيرليت. pH محايد (6.5-7). مثالية للأصص والأحواض والخضروات المنزلية. مُعقَّمة وخالية من بذور الحشائش والآفات.	1800	كيس	20	/api/img/enriched-soil.png	25	t	2026-05-04 09:04:44.333813+00	substrate
\.


--
-- Data for Name: sensor_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_devices (id, device_id, token, name, location, notes, created_at) FROM stdin;
1	sensor_demo123	demo_token_xyz	حقل الطماطم التجريبي	ورقلة	\N	2026-04-30 09:01:53.059343
\.


--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_readings (id, device_id, moisture, temperature, created_at) FROM stdin;
1	sensor_demo123	45.2	24.5	2026-04-30 09:01:53.059343
2	sensor_demo123	47.1	24.8	2026-04-30 09:01:53.059343
3	sensor_demo123	43.8	25.1	2026-04-30 09:01:53.059343
4	sensor_demo123	46	24.9	2026-04-30 09:01:53.059343
5	sensor_demo123	48.3	25.3	2026-04-30 09:01:53.059343
\.


--
-- Data for Name: subscription_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_deliveries (id, subscription_id, month_label, status, tracking_number, notes, shipped_at, delivered_at, created_at) FROM stdin;
3	3	ماي 2026	delivered	VF202652B41F89	\N	2026-05-02 15:49:47.069896+00	2026-05-03 08:24:37.43367+00	2026-05-02 14:50:37.755195+00
7	4	ماي 2026	delivered	VF2026483BCC81	\N	\N	2026-05-03 08:37:20.897852+00	2026-05-03 08:20:08.647279+00
8	5	ماي 2026	delivered	VF202647C722FE	\N	\N	2026-05-03 09:05:43.439014+00	2026-05-03 08:47:34.017087+00
9	6	ماي 2026	preparing	VF2026673B75EF	\N	\N	\N	2026-05-06 09:05:36.843254+00
10	7	ماي 2026	preparing	VF2026A89890FB	\N	\N	\N	2026-05-06 09:54:19.935119+00
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_plans (id, name, name_ar, name_fr, description, description_ar, description_fr, price_per_month, fertilizer_kg, includes_tips, includes_plan, includes_consultation, color, active, created_at) FROM stdin;
1	Green Box	الصندوق الأخضر	La Boîte Verte	Starter monthly box with organic worm castings and farming tips	صندوق شهري للمبتدئين: سماد ديدان عضوي + نصائح زراعية شهرية	Boîte mensuelle pour débutants: engrais lombricompost + conseils agricoles	2500	5	t	f	f	green	t	2026-05-02 13:13:52.757075+00
2	Farmer Box	صندوق الفلاح	La Boîte du Fermier	Complete monthly box for farmers with fertilizer, tips, and a customized crop plan	صندوق شهري متكامل: 10كغ سماد عضوي + نصائح + خطة زراعية مخصصة لمحصولك	Boîte mensuelle complète: 10kg d'engrais + conseils + plan cultural personnalisé	4500	10	t	t	f	amber	t	2026-05-02 13:13:52.757075+00
3	Expert Box	صندوق الخبير	La Boîte Expert	Premium monthly box for professionals with fertilizer, crop plan, and priority consultation	صندوق شهري للمحترفين: 20كغ سماد عضوي + خطة زراعية + استشارة زراعية أولوية	Boîte mensuelle professionnelle: 20kg d'engrais + plan cultural + consultation prioritaire	8000	20	t	t	t	emerald	t	2026-05-02 13:13:52.757075+00
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, customer_id, customer_name, customer_phone, plan_id, plan_name, price_at_subscription, fertilizer_kg, crop_type, delivery_address, delivery_city, status, start_date, next_renewal_date, notes, created_at, payment_method, payment_status, chargily_checkout_id) FROM stdin;
3	5	salima anifeg	4564654646	1	الصندوق الأخضر	2500	5	البطيخ	500 logemets	سعيدة	active	2026-05-02 14:45:09.030127+00	2026-06-02 14:45:09.029+00		2026-05-02 14:45:09.030127+00	online	paid	01kqmjd1qb0gsg6ymjnb9t5exr
4	4	bilal boussaadi	0657613345	1	الصندوق الأخضر	2500	5	الخس	rue 500 	تلمسان	active	2026-05-02 15:12:37.120928+00	2026-06-02 15:12:37.12+00		2026-05-02 15:12:37.120928+00	online	paid	01kqmkzb45y13fzeh25bx0asyv
5	6	wafa anifeg	4327635475247527	2	صندوق الفلاح	4500	10	الباذنجان	bni marad	البليدة	active	2026-05-03 08:46:33.712326+00	2026-06-03 08:46:33.712+00		2026-05-03 08:46:33.712326+00	online	paid	01kqpg95qb7bk6w2e1rs8jb57k
6	7	abdo tejini	6575765757576	2	صندوق الفلاح	4500	10	الفلفل	ksar el boukhari	المدية	active	2026-05-06 09:05:27.265684+00	2026-06-06 09:05:27.265+00		2026-05-06 09:05:27.265684+00	online	paid	01kqy8hxgry2pyrb2gcyag0xzr
7	7	abdo tejini	6575765757576	1	الصندوق الأخضر	2500	5	الخس	cite 60 log	البويرة	active	2026-05-06 09:53:53.013926+00	2026-06-06 09:53:53.013+00		2026-05-06 09:53:53.013926+00	online	paid	01kqybak6fbyhcec9ez7beyczc
\.


--
-- Data for Name: waste_collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.waste_collections (id, request_code, source_type, contact_name, contact_phone, address, waste_type, estimated_weight_kg, status, scheduled_date, collected_date, processing_start_date, completed_date, linked_batch_code, notes, created_at) FROM stdin;
1	WC-Q1REC4	restaurant	أحمد يوسف	0661234567	شارع الاستقلال، الرباط	food_scraps	12.00	pending	\N	\N	\N	\N	\N	بقايا طعام يومية	2026-04-29 15:24:51.332636+00
2	WC-12FKJ0	restaurant	zla9	543543435	rue babor	mixed	5.00	pending	2026-04-30	2026-04-30	\N	\N	\N	\N	2026-04-29 15:29:35.528551+00
3	WC-JWKVSG	restaurant	mansouri mohamed	4234242342	rue grande poste	food_scraps	10.00	collected	2026-04-29	2026-04-29	\N	\N	\N	\N	2026-04-29 16:05:23.422423+00
4	WC-D2MX5Y	restaurant	mansouri mohamed	4234242342	rue grand poste	food_scraps	20.00	collected	2026-04-29	2026-04-29	\N	\N	\N	\N	2026-04-29 16:18:30.132413+00
5	WC-XNSMFV	restaurant	krimo chaway	65776667765	rue bel3id	mixed	50.00	collected	2026-04-30	2026-04-30	\N	\N	\N	\N	2026-04-30 08:34:39.714982+00
6	WC-PEIZRE	farm	betin mohamed	53453453453453453	hanacha	mixed	40.00	scheduled	2026-05-05	2026-05-05	2026-05-06	2026-05-07	\N	\N	2026-05-04 09:42:23.510961+00
7	WC-P2D47U	restaurant	zla9	e3423423423423423	babor rue grande poste 	food_scraps	20.00	scheduled	2026-05-07	2026-05-07	2026-05-22	\N	\N	\N	2026-05-06 09:24:50.237078+00
\.


--
-- Name: admin_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notifications_id_seq', 26, true);


--
-- Name: admin_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_sessions_id_seq', 206, true);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: consultations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultations_id_seq', 3, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 18, true);


--
-- Name: course_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_enrollments_id_seq', 7, true);


--
-- Name: customer_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_sessions_id_seq', 61, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 8, true);


--
-- Name: delivery_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_sessions_id_seq', 55, true);


--
-- Name: delivery_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_users_id_seq', 9, true);


--
-- Name: discount_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discount_codes_id_seq', 12, true);


--
-- Name: donor_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donor_sessions_id_seq', 8, true);


--
-- Name: donors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donors_id_seq', 4, true);


--
-- Name: fertilizer_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fertilizer_batches_id_seq', 1, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 65, true);


--
-- Name: product_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_reviews_id_seq', 10, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 27, true);


--
-- Name: sensor_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_devices_id_seq', 1, true);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_readings_id_seq', 5, true);


--
-- Name: subscription_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_deliveries_id_seq', 10, true);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_plans_id_seq', 3, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 7, true);


--
-- Name: waste_collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.waste_collections_id_seq', 7, true);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_token_unique UNIQUE (token);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_unique UNIQUE (username);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: customer_sessions customer_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_sessions
    ADD CONSTRAINT customer_sessions_pkey PRIMARY KEY (id);


--
-- Name: customer_sessions customer_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_sessions
    ADD CONSTRAINT customer_sessions_token_key UNIQUE (token);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_referral_code_key UNIQUE (referral_code);


--
-- Name: delivery_sessions delivery_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sessions
    ADD CONSTRAINT delivery_sessions_pkey PRIMARY KEY (id);


--
-- Name: delivery_sessions delivery_sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_sessions
    ADD CONSTRAINT delivery_sessions_token_unique UNIQUE (token);


--
-- Name: delivery_users delivery_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_users
    ADD CONSTRAINT delivery_users_pkey PRIMARY KEY (id);


--
-- Name: delivery_users delivery_users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_users
    ADD CONSTRAINT delivery_users_username_unique UNIQUE (username);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: donor_sessions donor_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_sessions
    ADD CONSTRAINT donor_sessions_pkey PRIMARY KEY (id);


--
-- Name: donor_sessions donor_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_sessions
    ADD CONSTRAINT donor_sessions_token_key UNIQUE (token);


--
-- Name: donors donors_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_phone_key UNIQUE (phone);


--
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (id);


--
-- Name: donors donors_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_username_key UNIQUE (username);


--
-- Name: fertilizer_batches fertilizer_batches_batch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fertilizer_batches
    ADD CONSTRAINT fertilizer_batches_batch_code_key UNIQUE (batch_code);


--
-- Name: fertilizer_batches fertilizer_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fertilizer_batches
    ADD CONSTRAINT fertilizer_batches_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: sensor_devices sensor_devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_devices
    ADD CONSTRAINT sensor_devices_device_id_key UNIQUE (device_id);


--
-- Name: sensor_devices sensor_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_devices
    ADD CONSTRAINT sensor_devices_pkey PRIMARY KEY (id);


--
-- Name: sensor_readings sensor_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_pkey PRIMARY KEY (id);


--
-- Name: subscription_deliveries subscription_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_deliveries
    ADD CONSTRAINT subscription_deliveries_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: waste_collections waste_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waste_collections
    ADD CONSTRAINT waste_collections_pkey PRIMARY KEY (id);


--
-- Name: waste_collections waste_collections_request_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waste_collections
    ADD CONSTRAINT waste_collections_request_code_key UNIQUE (request_code);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_product ON public.product_reviews USING btree (product_id);


--
-- Name: orders_tracking_number_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_tracking_number_unique ON public.orders USING btree (tracking_number) WHERE (tracking_number IS NOT NULL);


--
-- Name: contact_messages contact_messages_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_sessions customer_sessions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_sessions
    ADD CONSTRAINT customer_sessions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict AwcwpuVxXBzh2Pbdj0ofnm4VHCdCedLnjBk5RTVNnzBx7yekdEeIHrotaYhJlbA

