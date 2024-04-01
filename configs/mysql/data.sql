
create table regismoto_db.registros
(
    id             int auto_increment
        primary key,
    nome           varchar(200) not null,
    telefone       varchar(20)  not null,
    endereco       varchar(200) null,
    email          varchar(200) not null,
    placa_moto     varchar(200) null,
    marca          varchar(200) null,
    modelo         varchar(200) null,
    numero_cnh     varchar(200) not null,
    tipo_sanguineo varchar(200) null,
    qr_code        varchar(200) null,
    UNIQUE(numero_cnh)
);