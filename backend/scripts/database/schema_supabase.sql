
-- Script para criao do schema no Supabase (PostgreSQL)

CREATE TABLE system_settings (
	key VARCHAR NOT NULL, 
	value TEXT, 
	description VARCHAR, 
	is_encrypted BOOLEAN, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (key)
);

CREATE TABLE workspaces (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, 
	logo_url VARCHAR, 
	primary_color VARCHAR, 
	accent_color VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	invitation_expiry_days INTEGER, 
	invitation_message TEXT, 
	PRIMARY KEY (id)
);

CREATE TABLE teams (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	workspace_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE work_item_types (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	label VARCHAR NOT NULL, 
	icon VARCHAR, 
	color VARCHAR, 
	workspace_id INTEGER, 
	is_system BOOLEAN, 
	source_type_id INTEGER, 
	PRIMARY KEY (id), 
	CONSTRAINT _workspace_item_type_uc UNIQUE (workspace_id, name), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
	FOREIGN KEY(source_type_id) REFERENCES work_item_types (id)
);

CREATE TABLE pipelines (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	type_id INTEGER NOT NULL, 
	team_id INTEGER, 
	workspace_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT _workspace_pipeline_uc UNIQUE (workspace_id, type_id, name), 
	FOREIGN KEY(type_id) REFERENCES work_item_types (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE property_definitions (
	id SERIAL NOT NULL, 
	entity_type VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	label VARCHAR NOT NULL, 
	type VARCHAR, 
	options TEXT, 
	is_system BOOLEAN, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT _workspace_prop_uc UNIQUE (workspace_id, entity_type, name), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE property_groups (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	"order" INTEGER, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT _workspace_group_uc UNIQUE (workspace_id, name), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	password VARCHAR NOT NULL, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	role VARCHAR, 
	reset_password_token VARCHAR, 
	reset_password_expires TIMESTAMP WITHOUT TIME ZONE, 
	preferences JSONB, -- Usando JSONB para melhor performance no Postgres
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE work_item_field_groups (
	id SERIAL NOT NULL, 
	type_id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	"order" INTEGER, 
	workspace_id INTEGER, 
	PRIMARY KEY (id), 
	CONSTRAINT _type_group_uc UNIQUE (type_id, name), 
	FOREIGN KEY(type_id) REFERENCES work_item_types (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE entity_property_links (
	id SERIAL NOT NULL, 
	entity_type VARCHAR NOT NULL, 
	property_id INTEGER NOT NULL, 
	group_id INTEGER, 
	"order" INTEGER, 
	is_required BOOLEAN, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES property_definitions (id), 
	FOREIGN KEY(group_id) REFERENCES property_groups (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE pipeline_stages (
	id SERIAL NOT NULL, 
	pipeline_id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	"order" INTEGER, 
	color VARCHAR, 
	is_final BOOLEAN, 
	metadata_json TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(pipeline_id) REFERENCES pipelines (id)
);

CREATE TABLE work_item_field_definitions (
	id SERIAL NOT NULL, 
	type_id INTEGER NOT NULL, 
	group_id INTEGER, 
	name VARCHAR NOT NULL, 
	label VARCHAR NOT NULL, 
	field_type VARCHAR, 
	options_json TEXT, 
	is_required BOOLEAN, 
	is_default BOOLEAN, 
	"order" INTEGER, 
	source_field_id INTEGER, 
	PRIMARY KEY (id), 
	CONSTRAINT _type_field_uc UNIQUE (type_id, name), 
	FOREIGN KEY(type_id) REFERENCES work_item_types (id), 
	FOREIGN KEY(group_id) REFERENCES work_item_field_groups (id), 
	FOREIGN KEY(source_field_id) REFERENCES work_item_field_definitions (id)
);

CREATE TABLE workspace_invitations (
	id SERIAL NOT NULL, 
	email VARCHAR NOT NULL, 
	token VARCHAR NOT NULL, 
	workspace_id INTEGER NOT NULL, 
	role VARCHAR, 
	team_id INTEGER, 
	invited_by INTEGER, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	accepted_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(invited_by) REFERENCES users (id)
);

CREATE TABLE companies (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	domain VARCHAR, 
	status VARCHAR, 
	stage_id INTEGER, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT _company_domain_uc UNIQUE (domain),
	FOREIGN KEY(stage_id) REFERENCES pipeline_stages (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE contacts (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR, 
	phone VARCHAR, 
	status VARCHAR, 
	stage_id INTEGER, 
	team_id INTEGER, 
	workspace_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT _contact_email_uc UNIQUE (email),
	FOREIGN KEY(stage_id) REFERENCES pipeline_stages (id), 
	FOREIGN KEY(team_id) REFERENCES teams (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE work_items (
	id SERIAL NOT NULL, 
	title VARCHAR NOT NULL, 
	description TEXT, 
	pipeline_id INTEGER NOT NULL, 
	stage_id INTEGER NOT NULL, 
	type_id INTEGER NOT NULL, 
	custom_fields JSONB, 
	workspace_id INTEGER NOT NULL, 
	owner_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(pipeline_id) REFERENCES pipelines (id), 
	FOREIGN KEY(stage_id) REFERENCES pipeline_stages (id), 
	FOREIGN KEY(type_id) REFERENCES work_item_types (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id)
);

CREATE TABLE company_contact_links (
	company_id INTEGER NOT NULL, 
	contact_id INTEGER NOT NULL, 
	PRIMARY KEY (company_id, contact_id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(contact_id) REFERENCES contacts (id)
);

CREATE TABLE company_property_values (
	id SERIAL NOT NULL, 
	company_id INTEGER NOT NULL, 
	property_id INTEGER NOT NULL, 
	value TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(property_id) REFERENCES property_definitions (id)
);

CREATE TABLE contact_property_values (
	id SERIAL NOT NULL, 
	contact_id INTEGER NOT NULL, 
	property_id INTEGER NOT NULL, 
	value TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(contact_id) REFERENCES contacts (id), 
	FOREIGN KEY(property_id) REFERENCES property_definitions (id)
);

CREATE TABLE work_item_history (
	id SERIAL NOT NULL, 
	work_item_id INTEGER NOT NULL, 
	from_stage_id INTEGER, 
	to_stage_id INTEGER NOT NULL, 
	changed_at TIMESTAMP WITHOUT TIME ZONE, 
	changed_by INTEGER, 
	workspace_id INTEGER NOT NULL, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(work_item_id) REFERENCES work_items (id), 
	FOREIGN KEY(from_stage_id) REFERENCES pipeline_stages (id), 
	FOREIGN KEY(to_stage_id) REFERENCES pipeline_stages (id), 
	FOREIGN KEY(changed_by) REFERENCES users (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id)
);
