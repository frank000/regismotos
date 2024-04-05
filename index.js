require('dotenv').config()

const express = require('express');
const qr = require('qrcode');
const nodemailer = require('nodemailer');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configuração do MySQL
const connection = mysql.createConnection({
    host: process.env.DBHOST,
    // host: 'mysqldb',

    port: process.env.DBPORT,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
});
connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });


app.use(express.static('public'));
app.use(express.json());

 
// Rota para consultar um registro pelo número da CNH
app.get('/api/consultaRegistro', async function(req, responseFull){ 

    console.log("CONSULTA ENTRADA - 1 : " , req.query.xkey)
    let decoded = Buffer.from(req.query.xkey, 'base64').toString();

    console.log("CONSULTA ENTRADA - 2 : " , decoded)
    const values = decoded.split("+");

    console.log("CONSULTA ENTRADA - 2 : " , values)
    let qr;
    // Consulta ao banco de dados
    select(values[0]).then(result => {
        responseFull.json({valido: true,  qrCode: null , result});
      }).catch(err => {
        responseFull.json({valido: false,  qrCode: null , result});
        console.error("Oops...", err);
      });
    
});



function select(attribute) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM registros WHERE numero_cnh = ${attribute}`;
      let query = connection.query(sql, (err, result, field) => {
        if(err) return reject(err);
        resolve(Object.values(JSON.parse(JSON.stringify(result))));
      });
    });
  }
// Rota para gerar QR code, enviar e-mail e salvar no banco de dados
app.post('/api/generateQR', (req, responseFull) => { 

     saveToDatabaseAndSendEmail(req.body)
    .then((res) => {  
        qr.toDataURL(Buffer.from(req.body.numeroCnh + '+' + res.insertId).toString('base64'))
        .then((url) => {
            responseFull.json({valido: true, qrCode: url , message: 'QR code enviado por e-mail e salvo no banco de dados com sucesso!' })
        },
        (reject)=>{
            console.error(err);
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((error) => {
        
        responseFull.json({valido: false,  qrCode: null , message: error});
    });
 

  
});

 

async function saveToDatabaseAndSendEmail(data) {
    return new Promise((resolve, reject) => {

        const resultadoValidacao = validarCampos(data);
        console.info(resultadoValidacao)
        if (resultadoValidacao.valido) {
            const { nome, cpf, telefone, endereco, email, placaMoto, marca, modelo, numeroCnh, tipoSanguineo, qrCode } = data;
        
            const sql = 'INSERT INTO registros (nome, cpf, telefone, endereco, email, placa_moto, marca, modelo, numero_cnh, tipo_sanguineo, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(sql, [nome, cpf, telefone, endereco, email, placaMoto, marca, modelo, numeroCnh, tipoSanguineo, qrCode], (error, results) => {
                if (error) {
                    console.log("erro do banco" , error)
                    reject(error.code);
                } else {
                    resolve(results);
     
                  
                }
            });
        } else {
            let msg = 'Campos faltantes:' +  resultadoValidacao.camposVazios.join(", ");
            console.log(msg);
            reject(msg)
        }
                
                
     
    });
}
function validarCampos(data) {
    const camposObrigatorios = ['nome', 'telefone', 'endereco', 'email', 'placaMoto', 'marca', 'modelo', 'numeroCnh', 'tipoSanguineo'];
    const camposFaltantes = [];
    const camposVazios = [];

    camposObrigatorios.forEach(campo => {
        if (!data.hasOwnProperty(campo)) {
            camposFaltantes.push(campo);
        } else if (!data[campo] || data[campo].trim() === '') {
            camposVazios.push(campo);
        }
    });

    if (camposFaltantes.length > 0 || camposVazios.length > 0) {
        return { valido: false, camposFaltantes, camposVazios };
    } else {
        return { valido: true };
    }
}
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});