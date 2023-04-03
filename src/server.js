
const express = require('express');
const app  = express() ;
const port = process.env.PORT || 4200; 

//database connection end with mongoDB 

app.get("/", (req, res) => {
    res.send("This is home page")
}); 

 // >>----------------->>

app.listen(port, (req, res) => {
    console.log(`Server runing on port number: ${port}`);
});

