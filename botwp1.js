const fs = require('fs');
const si = require('systeminformation');
const fetch = require("node-fetch");
const cc = require('cryptocompare');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const { Client, Chat, PrivateChat, GroupChat, Message, MessageMedia, Contact, PrivateContact, BusinessContact, ClientInfo, Location } = require('whatsapp-web.js');
const SESSION_FILE_PATH = './data/session.json';
const SESSION_PRIVATE_KEY = './data/private_key.txt';
const SESSION_PUBLIC_KEY = './data/public_key.txt';
cc.setApiKey('27720f88def9dc567dccf8fdf1e969eabfb9f92e4f850ac60e5e2ca34a558483')

var text2png = require('text2png');
const { AwesomeQR } = require("awesome-qr");
var crypto = require('crypto');
var numero_usuario = '5491164025326@c.us';

var sessionCfg = '';
var sprivatek = '';
var spublick = '';
var app_status = 1;
var client;
var delete_messages = false;

const NodeRSA = require('node-rsa');
var key = new NodeRSA();
var filenamex = '';

if (fs.existsSync(SESSION_FILE_PATH) && fs.existsSync(SESSION_PRIVATE_KEY) && fs.existsSync(SESSION_PUBLIC_KEY)) {
    app_status = 2;
	console.log('AUTENTICACION ENCONTRADA EN ARCHIVO...');
    sessionCfg = require(SESSION_FILE_PATH);
    fs.readFile(SESSION_PRIVATE_KEY, 'utf8', function(err, data) {
        if (err) throw err;
        key.importKey(data, 'pkcs8');
    });
    session = JSON.stringify(sessionCfg);
    client = new Client({ puppeteer: { headless: true }, session: sessionCfg, ffmpegPath: '/bin/ffmpeg' });
} else {
    client = new Client();
}

client.on('qr', (qr) => {
    if (app_status == 1) {
        console.clear();
        console.log('-------- CODIGO QR PARA INICIAR SESION --------');
        qrcode.generate(qr, {small: true});
    }
});

client.on('authenticated', (session) => {
    console.clear();
    console.log('AUTENTICADO CORRECTAMENTE.');
    app_status = 2;
    if (!fs.existsSync(SESSION_FILE_PATH)) {
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
            if (err) {
                console.error(err);
            }
        });
    }
    if (!fs.existsSync(SESSION_PRIVATE_KEY ) || !fs.existsSync(SESSION_PUBLIC_KEY)) {
        key = new NodeRSA({b: 4096});
        spublick = key.exportKey('pkcs8-public-pem');
        sprivatek = key.exportKey('pkcs8-private-pem');
        fs.writeFile(SESSION_PRIVATE_KEY, sprivatek, function(err) {
            if (err) {
                console.error(err);
            }
        });
        fs.writeFile(SESSION_PUBLIC_KEY, spublick, function(err) {
            if (err) {
                console.error(err);
            }
        });
    }
});

client.on('auth_failure', msg => {
    console.error('FALLO LA AUTENTICACION', msg);
});

client.on('ready', () => {
    console.log('CORRIENDO OK.');
    app_status = 3;
    engine();
	sendMessage(numero_usuario, '*Alice:* sistema cargado correctamente.');
});

client.on('message', async msg => {

	// Guardo los mensajes en la base de datos.
	console.log('Mensaje recibido de ' + msg.from);
    guardarMensaje(msg.body, msg.from, 1);
    
    // Guarda los archivos recibidos en la tarjeta de memoria.
	if (msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        console.log('Nuevo archivo recibido de ' + msg.from);
        var extension = attachmentData.mimetype.split("/")[1];
        var base64Data = attachmentData.data.replace(/^data:image\/png;base64,/, "");
        var new_filename = "./" + randomString('16', 'aA#') + '.' + extension;
        filenamex = new_filename.replace('./','');;
        fs.writeFile('/home/fox/Multimedia/' + new_filename, base64Data, 'base64', function(err) {
            if (err != null) {
                console.log(err);
                return;
            }
        });
    }

    // Comandos
    if (msg.body == '!ayuda') {
        sendMessage(msg.from, messages[1]);
    } else if (msg.body.startsWith('!qr ')) {
        const background = fs.readFileSync("/home/fox/Multimedia/background.png");
        const buffer = await new AwesomeQR({
          text: "Prueba.",
          size: 500
        }).draw();
        fs.writeFileSync("/home/fox/Multimedia/qrcode.png", buffer);
        const qrc = MessageMedia.fromFilePath('/home/fox/Multimedia/qrcode.png');
        sendMessage(msg.from, qrc, { sendMediaAsSticker: true });
    } else if (msg.body.startsWith('!script ')) {
        let sscript = msg.body.slice(8);
        eval(sscript);
	} else if (msg.body.startsWith('!btc')) {
		cc.price('BTC', ['USD', 'EUR'])
		.then(prices => {
			sendMessage(msg.from, 'El precio del *Bitcoin* es *' + prices['USD'] + '* USD');
		})
    } else if (msg.body.startsWith('!encriptar ') && msg.hasMedia) {
        sendMessage(msg.from, 'Encriptando archivo...');
        var key = msg.body.slice(11);
        var cipher = crypto.createCipher('aes-256-cbc', key);
        var input = fs.createReadStream('/home/fox/Multimedia/'+filenamex);
        var output = fs.createWriteStream('/home/fox/Multimedia/'+filenamex+'.enc');
        input.pipe(cipher).pipe(output);
        output.on('finish', function() {
            sendMessage(msg.from, 'Archivo encriptado correctamente.');
            const media3 = MessageMedia.fromFilePath('/home/fox/Multimedia/'+filenamex+'.enc');
            sendMessage(msg.from, media3, { sendMediaAsDocument: true });
        });
    } else if (msg.body.startsWith('!desencriptar ') && msg.hasMedia) {
        sendMessage(msg.from, 'Desencriptando archivo...');
        var key = msg.body.slice(14);
        var decipher = crypto.createDecipher('aes-256-cbc', key);
        var input = fs.createReadStream('/home/fox/Multimedia/'+filenamex);
        var output = fs.createWriteStream('/home/fox/Multimedia/des.'+filenamex);
        input.pipe(decipher).pipe(output);
        output.on('finish', function() {
            sendMessage(msg.from, 'Archivo encriptado correctamente.');
            const media3 = MessageMedia.fromFilePath('/home/fox/Multimedia/'+filenamex+'.enc');
            sendMessage(msg.from, media3, { sendMediaAsDocument: true });
        });
    } else if (msg.body.startsWith('!enc ')) {
        let txt = msg.body.slice(5);
        sendMessage(msg.from, encode(txt));
    } else if (msg.body.startsWith('!dec ')) {
        let txt = msg.body.slice(5);
		try {
			sendMessage(msg.from, decode(txt));
		} catch (e) {
			sendMessage(msg.from, 'No puedo decifrar el mensaje, clave incorrecta.');
		}
    } else if (msg.body.startsWith('!texto ')) {
        let textimg = msg.body.slice(7);
        let buff = text2png(textimg.replace('\n','\n'), {
          font: '80px Futura',
          color: 'teal',
          backgroundColor: 'linen',
          lineSpacing: 10,
          padding: 20
        });
        fs.writeFileSync('/home/fox/Multimedia/out.png', buff);
        const sticker = MessageMedia.fromFilePath('/home/fox/Multimedia/out.png');
        sendMessage(msg.from, sticker, { sendMediaAsSticker: true });
    } else if (msg.body.startsWith('!prueba')) {
        sendMessage(msg.from, `Enviando y evaluando...`);
        const sticker = MessageMedia.fromFilePath('/home/fox/Multimedia/test.png');
        sendMessage(msg.from, sticker, { sendMediaAsSticker: true });
        const media2 = MessageMedia.fromFilePath('/home/fox/Multimedia/9J9DrcCGScDJZeZe.webp');
        sendMessage(msg.from, media2, { sendMediaAsSticker: true });
        const media3 = MessageMedia.fromFilePath('/home/fox/Multimedia/PFqxjJlJEiI35656.jpeg');
        sendMessage(msg.from, media3, { sendMediaAsDocument: true });
    } else if (msg.body.startsWith('!send ')) {
		let numero = msg.body.split(' ')[1];
		let usuario = numero + '@c.us';
		let texto = msg.body.split(numero + ' ')[1];
		console.log("Enviando mensaje por pedido a " + numero);
		sendMessage(usuario, texto);
	} else if (msg.body == '!delete_texts') {
        delete_messages = true;
    } else if (msg.body == '!no_delete_texts') {
        delete_messages = false;
    } else if (msg.body == '!ping reply') {
        msg.reply('pong');
    } else if (msg.body == '!ping') {
        sendMessage(msg.from, 'pong');
    } else if (msg.body.startsWith('!sendto ')) {
        let number = msg.body.split(' ')[1];
        let messageIndex = msg.body.indexOf(number) + number.length;
        let message = msg.body.slice(messageIndex, msg.body.length);
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        let chat = await msg.getChat();
        chat.sendSeen();
        sendMessage(number, message);

    } else if (msg.body.startsWith('!subject ')) {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newSubject = msg.body.slice(9);
            chat.setSubject(newSubject);
        } else {
            msg.reply('Este comando solo se puede usar en un grupo!');
        }
    } else if (msg.body.startsWith('!echo ')) {
        msg.reply(msg.body.slice(6));
    } else if (msg.body.startsWith('!desc ')) {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            let newDescription = msg.body.slice(6);
            chat.setDescription(newDescription);
        } else {
            msg.reply('Este comando solo se puede usar en un grupo!');
        }
    } else if (msg.body == '!leave') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            chat.leave();
        } else {
            msg.reply('Este comando solo se puede usar en un grupo!');
        }
    } else if (msg.body.startsWith('!join ')) {
        const inviteCode = msg.body.split(' ')[1];
        try {
            await client.acceptInvite(inviteCode);
            msg.reply('Hola!');
        } catch (e) {
            msg.reply('No es un codigo valido.');
        }
    } else if (msg.body == '!groupinfo') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
                *Detalles del grupo*
                Nombre: ${chat.name}
                Descripcion: ${chat.description}
                Creado: ${chat.createdAt.toString()}
                Autor: ${chat.owner.user}
                Participantes: ${chat.participants.length}
            `);
        } else {
            msg.reply('Este comando solo se puede usar en grupo!');
        }
    } else if (msg.body == '!chats') {
        const chats = await client.getChats();
        sendMessage(msg.from, `Tengo ${chats.length} chats abiertos.`);
    } else if (msg.body == '!info') {
        let info = client.info;
        sendMessage(msg.from, `
            *Informacion de conexion*
            Nombre: ${info.pushname}
            Numero: ${info.me.user}
            Plataforma: ${info.platform}
            Version WhatsApp: ${info.phone.wa_version}
        `);
    } else if (msg.body == '!mediainfo' && msg.hasMedia) {
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Detalles de archivo*
            Tipo: ${attachmentData.mimetype}
            Nombre: ${attachmentData.filename}
            Cantidad de datos: ${attachmentData.data.length}
        `);
    } else if (msg.body == '!quoteinfo' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Tipo: ${quotedMsg.type}
            Autor: ${quotedMsg.author || quotedMsg.from}
            Hora: ${quotedMsg.timestamp}
            Adjuntos: ${quotedMsg.hasMedia}
        `);
    } else if (msg.body == '!resendmedia' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const attachmentData = await quotedMsg.downloadMedia();
            sendMessage(msg.from, attachmentData, { caption: 'Lo que pediste.' });
        }
    } else if (msg.body == '!location') {
        msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'));
    } else if (msg.location) {
        msg.reply(msg.location);
    } else if (msg.body.startsWith('!status ')) {
        const newStatus = msg.body.split(' ')[1];
        await client.setStatus(newStatus);
        msg.reply(`El estado fue actualizado a *${newStatus}*`);
    } else if (msg.body == '!mention') {
        const contact = await msg.getContact();
        const chat = await msg.getChat();
        chat.sendMessage(`Hola @${contact.number}!`, {
            mentions: [contact]
        });
    } else if (msg.body == '!delete' && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.fromMe) {
            quotedMsg.delete(true);
        } else {
            msg.reply('Solo puedo eliminar mis mensajes.');
        }
    } else if (msg.body === '!pin') {
        const chat = await msg.getChat();
        await chat.pin();
    } else if (msg.body === '!archive') {
        const chat = await msg.getChat();
        await chat.archive();
    } else if (msg.body === '!mute') {
        const chat = await msg.getChat();
        const unmuteDate = new Date();
        unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
        await chat.mute(unmuteDate);
    } else if (msg.body === '!typing') {
        const chat = await msg.getChat();
        chat.sendStateTyping();        
    } else if (msg.body === '!recording') {
        const chat = await msg.getChat();
        chat.sendStateRecording();        
    } else if (msg.body === '!clearstate') {
        const chat = await msg.getChat();
        chat.clearState();        
    } else {
        //const chats = await client.getChats();
        //sendMessage(msg.from, messages[3]);
    }
});

client.on('message_create', (msg) => {
    if(msg.fromMe && delete_messages) {
        setTimeout(function(){msg.delete(true)}, 15000);
    }
});

client.on('message_revoke_everyone', async (after, before) => {
    //console.log('Un mensaje fue eliminado por ' + after.author);
    if (before) {
    //    console.log('Mensaje borrado: ' + before.body);
    }
});

client.on('message_revoke_me', async (msg) => {
    //console.log('Mensaje eliminado: ' + msg.body);
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */
    if(ack == 3) {
        // The message was read
    }
});

client.on('group_join', (notification) => {
    console.log('join', notification);
    notification.reply('Entro un usuario.');
});

client.on('group_leave', (notification) => {
    console.log('leave', notification);
    notification.reply('Un usuario se fue.');
});

client.on('group_update', (notification) => {
    console.log('update', notification);
});

client.on('change_battery', (batteryInfo) => {
    const { battery, plugged } = batteryInfo;
    if (plugged == true) { plugged = 'no'; } else { plugged = 'si'; }
    console.log(`Bateria: ${battery}% - Cargando: ${plugged}`);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado: ', reason);
});

client.initialize();

function engine() {
    enviarMensajes();
	si.cpuTemperature().then(data => {
		if (data['cores'][0] >= 85 || data['cores'][1] >= 85) enviarMensaje(numero_usuario, 'Los CPU del servidor se encuentran a ' + data['cores'][0] + '° y ' + data['cores'][1] + '°', 0);
	});
    setTimeout(engine, 10000);
}

function delay(time) {
   return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   });
}

function sendMessage(from, text){
    if (false) sendMessage(from, text);
}

function enviarMensajes() {
    var headersOpt = {
        "content-type": "application/json",
    };
    request({
        method: 'post',
        url: 'http://'+IP_DB+'/whatsapp/api',
        form: {
            action: 'get',
            type: 0
        },
        headers: headersOpt,
        json: true,
    }, function(error, response, body) {
        if (body != null && body['success'] != null && body['success'] == 1) {
            body['data'].forEach(function(element) {
                let n_usuario = decode(element['num']);
                let msg_usuario = decode(element['msg']);
                let idn = element['id'];
                console.log('Nuevo mensaje para ' + n_usuario);
                enviarMensaje(n_usuario, msg_usuario, idn);
            });
        }
    });
}

function enviarMensaje(numero, msg, idn) {
    console.log('Enviando mensaje a ' + numero);
    sendMessage(numero, msg).then(async () => {
        console.log('Mensaje enviado.');
		eliminarMensaje(idn);
    }).catch(error => {
        console.log('Error al enviar mensaje.');
		eliminarMensaje(idn);
    });;
}

function eliminarMensaje(idn) {
    var headersOpt = {
        "content-type": "application/json",
    };
    request({
        method: 'post',
        url: 'http://'+IP_DB+'/whatsapp/api',
        form: {
            action: 'delete',
            id: idn
        },
        headers: headersOpt,
        json: true,
    }, function(error, response, body) {
        //console.log(body['success']);
    });
}

function guardarMensaje(texto, numero, tipo = 1) {
	console.log('Guardando mensaje de ' + numero);
    var headersOpt = {
        "content-type": "application/json",
    };
    request({
        method: 'post',
        url: 'http://'+IP_DB+'/whatsapp/api',
        form: {
            action: 'send',
            num: encode(numero),
            msg: encode(texto),
            type: tipo
        },
        headers: headersOpt,
        json: true,
    }, function(error, response, body) {
        //console.log(body['success']);
    });
}

function encode(data) {
    const base64data = key.encrypt(data, 'base64');
    return base64data;
}

function decode(data) {
    const text = key.decrypt(data, 'utf8');
    return text;
}

// Funciones importadas

function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}

var getFromBetween = {
    results:[],
    string:"",
    getFromBetween:function (sub1,sub2) {
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        var SP = this.string.indexOf(sub1)+sub1.length;
        var string1 = this.string.substr(0,SP);
        var string2 = this.string.substr(SP);
        var TP = string1.length + string2.indexOf(sub2);
        return this.string.substring(SP,TP);
    },
    removeFromBetween:function (sub1,sub2) {
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
        var removal = sub1+this.getFromBetween(sub1,sub2)+sub2;
        this.string = this.string.replace(removal,"");
    },
    getAllResults:function (sub1,sub2) {
        // first check to see if we do have both substrings
        if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

        // find one result
        var result = this.getFromBetween(sub1,sub2);
        // push it to the results array
        this.results.push(result);
        // remove the most recently found one from the string
        this.removeFromBetween(sub1,sub2);

        // if there's more substrings
        if(this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
            this.getAllResults(sub1,sub2);
        }
        else return;
    },
    get:function (string,sub1,sub2) {
        this.results = [];
        this.string = string;
        this.getAllResults(sub1,sub2);
        return this.results;
    }
};

// Textos;

var messages = new Array(
`*Probando...*`,
`*Lista de comandos*

*!ping*
*!send* _<telefono>_ _<mensaje>_
*!mediainfo* _<archivo>_`,
`*$XXXXX$*`,
`No te entiendo.`
);