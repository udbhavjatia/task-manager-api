const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'udbhavjatia@gmail.com',
        subject: 'Welcome to Task Manager Application',
        html: `Welcome <strong>${name}</strong>.<br><br>It's great to have you onboard Task Manager. Let me know if you need anything.<br><br>Cheers<br>Udbhav`
    })
};

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'udbhavjatia@gmail.com',
        subject: 'Sorry to see you go!',
        html: `Hey <strong>${name}</strong>.<br><br>We are really sad to see you leave. We would really appreciate it if you could let us know what we can do better.<br><br>Cheers<br>Udbhav`
    })
};

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancelationEmail: sendCancelationEmail
}