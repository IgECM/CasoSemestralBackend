const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const outputFile = './swagger.json';
const endPointsFiles = ['./app.js'];

const doc = {
  info: {
    title: 'API REST - Veterinaria San Marcos',
    description: 'Documentación generada automáticamente con Swagger Autogen',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://32.202.111.243:3000',
      description: 'Servidor AWS EC2'
    },
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

swaggerAutogen(outputFile, endPointsFiles, doc);