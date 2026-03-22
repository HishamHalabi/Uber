import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "hishamhalabyshehata@gmail.com",
    pass: "mblf czho zxtk glxl",
  },
});

export async function SendEMail(to ,   subject , html){
  const info = await transporter.sendMail({
    from: '"Uber" <hishamhalabyshehata@gmail.com>',
    to,
    subject  , 
    html
  });
}

 