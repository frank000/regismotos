const express = require('express');
const qr = require('qrcode');
const nodemailer = require('nodemailer');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configuração do MySQL
const connection = mysql.createConnection({
    host: 'mysqldb',
    // host: 'mysqldb',

    port:'3306',
    user: 'user',
    password: 'password',
    database: 'regismoto_db'
});
connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    host: 'mail.pm.df.gov.br',
    port: 25,
    from: "pmdf@pm.df.gov.br",
    // tls: true,
    ignoreTLS:true,
    auth: {
        user: 'sgpol',
        pass: 'sgpol10203040'
    },

});
transporter.verify(function(error, success) {
    if (error) {
         console.log(error);
    } else {
         console.log('Server is ready');
    }
});
app.use(express.static('public'));
app.use(express.json());

app.get('/api/teste', (req, res) => {
    res.status(200).json("ok"); 
});
// Rota para consultar um registro pelo número da CNH
app.post('/api/consultaRegistro', (req, res) => {
 
    let decoded = Buffer.from(req.body.xkey, 'base64').toString();
    const values = decoded.split("+");

    // Consulta ao banco de dados
    connection.query('SELECT * FROM registros WHERE numero_cnh = ?', [values[0]], (error, results) => {
        if (error) {
            console.error('Erro ao consultar o registro:', error);
            res.status(500).json({ error: 'Erro ao consultar o registro' });
        } else {
            if (results.length > 0) {
                res.status(200).json(results[0]); // Retorna o primeiro registro encontrado
            } else {
                res.status(404).json({ error: 'Registro não encontrado' });
            }
        }
    });
});

// Rota para gerar QR code, enviar e-mail e salvar no banco de dados
app.post('/api/generateQR', (req, responseFull) => { 
    console.log(req.body.nome)

     saveToDatabaseAndSendEmail(req.body)
    .then((res) => { 
        qr.toDataURL(Buffer.from(req.body.numero_cnh+ '+' + res.insertId).toString('base64'))
        .then((url) => {
            responseFull.json({ qrCode: url , message: 'QR code enviado por e-mail e salvo no banco de dados com sucesso!' })

            // sendEmail(req.body.nome, req.body.email, req.body.res)
            // .then((ok) => {
            //     res.json({ qrCode: url , message: 'QR code enviado por e-mail e salvo no banco de dados com sucesso!' })
            //     resolve(ok);
            //     //ok.json({ qrCode: url , message: 'QR code enviado por e-mail e salvo no banco de dados com sucesso!' });

            // })
            // .catch((error) => {
            //     console.error('Erro ao salvar no banco de dados e/ou enviar e-mail:', error);

            // });

        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((error) => {
        console.error('Erro ao salvar no banco de dados e/ou enviar e-mail:', error);
    });
 

  
});

 

async function saveToDatabaseAndSendEmail(data) {
    return new Promise((resolve, reject) => {
        const { nome, telefone, endereco, email, placaMoto, marca, modelo, numeroCnh, tipoSanguineo, qrCode } = data;
        const sql = 'INSERT INTO registros (nome, telefone, endereco, email, placa_moto, marca, modelo, numero_cnh, tipo_sanguineo, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        connection.query(sql, [nome, telefone, endereco, email, placaMoto, marca, modelo, numeroCnh, tipoSanguineo, qrCode], (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
 
              
            }
        });
    });
}
// Função para enviar e-mail
async function sendEmail(qrCode, recipientEmail) {
    await transporter.sendMail({
        from: 'seu_email',
        to: recipientEmail,
        subject: 'Código QR',
        html: `<p>Segue o código QR:</p><img src="${qrCode}" alt="QR Code">`
    });
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});