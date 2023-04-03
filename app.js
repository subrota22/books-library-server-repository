require("dotenv").config();
const express = require('express');
const jwt = require("jsonwebtoken") ;
const app  = express() ;
const port = process.env.PORT || 4000; 
const mongoose = require("mongoose").set("strictQuery", true);
const mongoDB_url = process.env.mongodb_url;
const cors = require("cors") ; 
app.use(express.json()) ;
app.use('*', cors());

//database connection start with mongoDB 

const options = { useNewUrlParser: true, useUnifiedTopology: true  }
mongoose
  .connect(mongoDB_url, options)
  .then(() =>  console.log("Successfully connected with mongoDB !! "))
  .catch(error => {
    throw error
  });

//database connection start with mongoDB 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const client = new MongoClient(mongoDB_url, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const booksCollection = client.db("book-store").collection("books");
const usersCollection = client.db("book-store").collection("users");

// database connection end with mongoDB  

//verify token
const verifyToken = (req , res , next ) => {
  const token = req.headers.authentication ; 
  const getToken = token.split(" ")[1] ;
 jwt.verify(getToken , process.env.token , (error , decodedData) => {
  if(error) {
      return res.status(403).send({message:"unauthorize access"}) ;
  }  
      req.decodedData = decodedData ;
      next() ;
 })
  }   

// get books

app.get("/getBooks" , async (req , res)  => {
const page =  parseInt(req.query.page) ; 
const size = parseInt(req.query.size );
const cursor =  booksCollection.find({});
const count = await booksCollection.estimatedDocumentCount();
const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
const paginationInfo = {data:data , count:count} ;
return res.send(paginationInfo) ;
}) ; 

//myBooks
app.get("/myBooks" , async (req , res)  => {
const page =  parseInt(req.query.page) ; 
const size = parseInt(req.query.size );
const email = req.query.email ;
const cursor =  booksCollection.find({email:email});
const count = await booksCollection.count({email:email});
const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
const paginationInfo = {data:data , count:count} ;
return res.send(paginationInfo) ;
}) ;
 
//add book
app.post("/addBook" , async (req, res) => {
const insertingData = req.body ;
const result = await booksCollection.insertOne(insertingData) ;
res.status(201).send(result) ;
});  

//edit book
app.put("/editBook" , verifyToken , async (req, res) => {
const updateData = req.body ;
const option = {upsert:true} ;
const id = req.query.id ;
const query = {_id:new ObjectId(id)} ;
const updatedDocument = {
  $set:{
    isbn:updateData.isbn,
    title:updateData.title,
    author:updateData.author,
    description:updateData.description,
    published_year:updateData.published_year,
    publisher:updateData.publisher,
    bookName:updateData.bookName,
    bookImage:updateData.bookImage, 
    updated_date:updateData.date
  }
} 
//check user
const decodedEmail = req.decodedData?.email ;
const findEmail =  await booksCollection.findOne({email:decodedEmail}) ;
const email = req.query.email ;
if(findEmail?.email === decodedEmail) {
  const result = await booksCollection.updateOne(query , updatedDocument , option) ;
  res.status(201).send(result) ;
}else{
  res.status(403).send("ERROR") ;
}

})

app.get("/bookData/:id" , async (req ,res) => {
  const id = req.params.id ;
  const resut = await booksCollection.findOne({_id: new ObjectId(id)}) ;
  res.status(201).send(resut) ;
  })

  // delete book

  app.delete("/deleteBooks", verifyToken,  async(req, res) => {
   const id = req.query.id ;
   const email = req.query.email ;
   const decodedEmail = req.decodedData?.email ;
   const query = {_id : new ObjectId(id)} ;
    //check user
   if(email === decodedEmail) {
    const result = await booksCollection.deleteOne(query) ;
    res.status(201).send(result) ;
  }else{
    res.status(403).send("ERROR") ;
  }
  });
  //create new user
  app.post("/users" , async(req , res) => {
   const insertingData = req.body ;
   const findData  = await usersCollection.findOne({email:req.body.email}) ;
   if(findData){
    return res.status(400).send("existed") ;
   }else{
   const result = await usersCollection.insertOne(insertingData) ;
   return res.status(201).send(result) ;
   }
  });
  //get user datar
    app.get("/users" , async(req , res) => {
      const page =  parseInt(req.query.page) ; 
      const size = parseInt(req.query.size );
      const cursor =  usersCollection.find();
      const count = await usersCollection.estimatedDocumentCount();
      const data = await cursor.skip(page * size).limit(size).sort({_id: -1 }).toArray();
      const paginationInfo = {data:data , count:count} ;
      return res.send(paginationInfo) ;
     })
  
  //database connection end with mongoDB 
  
  // create jwt token 
  app.post("/jwt" , async(req, res) => {
  const email = req.body ;
  const token =  jwt.sign(email , process.env.token  , {expiresIn:"3d"}) ;
  res.status(201).send({token:token}) ;
  })
  app.get("/", (req, res) => {
      res.send("This is home page")
  }); 
  
   // >>----------------->>
  
  app.listen(port, (req, res) => {
      console.log(`Server runing on port number: ${port}`);
  });
  

  


// //book schema for graphQL
// function bookSchema () {
// var bookType = new GraphQLObjectType({
//   name: 'book',
//   fields: function () {
//     return {
//       _id: {
//         type: GraphQLString
//       },
//       isbn: {
//         type: GraphQLString
//       },
//       title: {
//         type: GraphQLString
//       },
//       author: {
//         type: GraphQLString
//       },
//       description: {
//         type: GraphQLString
//       },
//       published_year: {
//         type: GraphQLInt
//       },
//       publisher: {
//         type: GraphQLString
//       },
//       updated_date: {
//         type: GraphQLDate
//       }
//     }
//   }
// });

// //

// var queryType = new GraphQLObjectType({
//   name: 'Query',
//   fields:  function () {
//     return {
//       books: {
//         type: new GraphQLList(bookType),
//         resolve:async function () {
//           const books = await bookInfo.find().exec()
//           if (!books) {
//             throw new Error('Error')
//           }
//           return books
//         }
//       },
//       book: {
//         type: bookType,
//         args: {
//           id: {
//             name: '_id',
//             type: GraphQLString
//           }
//         },
//         resolve: async function (root, params) {
//           const bookDetails = await bookInfo.findById(params.id).exec();
//           if (!bookDetails) {
//             throw new Error('Error')
//           }
//           return bookDetails
//         }
//       } 
//     }
//   }
// });


// var mutation = new GraphQLObjectType({
//   name: 'Mutation',
//   fields: function () {
//     return {
//       //add book 
//       addBook: {
//         type: bookType,
//         args: {
//           isbn: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           title: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           author: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           description: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           published_year: {
//             type: new GraphQLNonNull(GraphQLInt)
//           },
//           publisher: {
//             type: new GraphQLNonNull(GraphQLString)
//           }
//         },
//         resolve: async function  (root, params) {
//           const bookModel =  new bookInfo(params);
//           const newBook = await  bookModel.save();
//           if (!newBook) {
//             throw new Error('Error');
//           }
//           return newBook
//         }
//       },
// //update 
//       updateBook: {
//         type: bookType,
//         args: {
//           id: {
//             name: 'id',
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           isbn: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           title: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           author: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           description: {
//             type: new GraphQLNonNull(GraphQLString)
//           },
//           published_year: {
//             type: new GraphQLNonNull(GraphQLInt)
//           },
//           publisher: {
//             type: new GraphQLNonNull(GraphQLString)
//           }
//         },
//         resolve: async function (root, params) {
//           await bookInfo.findByIdAndUpdate(params.id, { isbn: params.isbn, title: params.title, author: params.author, description: params.description, published_year: params.published_year, publisher: params.publisher, updated_date: new Date() }, function (err) {
//             if (err) return next(err);
//           });
//         }
//       },
// //remove book 
//       removeBook: {
//         type: bookType,
//         args: {
//           id: {
//             type: new GraphQLNonNull(GraphQLString)
//           }
//         },
//         resolve:async function(root, params) {
//           const remBook = await bookInfo.findByIdAndRemove(params.id).exec();
//           if (!remBook) {
//             throw new Error('Error')
//           }
//           return remBook;
//         }
//       } ,
     

//     }
//   }
// });
// return  new GraphQLSchema({query:queryType, mutation: mutation });  ;
// }
// //>>------------------>>---------->> schema end 

// //graphQL connectin 
// const bookSchemaGet = bookSchema() ;
// app.use('/books', cors(), graphqlHTTP({
//   schema: bookSchemaGet,
//   rootValue: global,
//   graphiql: true,
// }));




// var paginationType = new GraphQLObjectType({
//   name: 'bookQuery',
//   fields: function () {
//     return {
//       page: {
//         type: GraphQLString
//       },
//       size: {
//         type: GraphQLString
//       }
   
//     }
//   }
//   });
  
//   var paginationQuery = new GraphQLObjectType({
//   name: 'paginationQuery',
//   fields:  function () {
//     return {
//       booksQuery: {
//         type: new GraphQLList(paginationType),
//         resolve:async function () {
//           const data = await bookInfo.find();
//           if (!data) {
//             throw new Error('Error')
//           }
//           return data
//         }
//       },
    
//     }
//     }
//     }) ;
  
//     var paginationMutaion = new GraphQLObjectType({
//       name: 'mutation',
//       fields: function () {
//         return {
//           booksQuery: {
//             type: paginationType,
//             args: {
//               page: {
//                 type: new GraphQLNonNull(GraphQLString)
//               },
//               size: {
//                 type: new GraphQLNonNull(GraphQLString)
//               }
//             },
//             resolve: async function  (root, params) {
//               const page = parseInt(params.page);
//               const size = parseInt(params.size);
//               console.log("books params ==>" , params);
//               // ----> parametar  <---- //
//               const count = await bookInfo.estimatedDocumentCount();
//               const data = await bookInfo.find().skip(page * size).limit(size).sort({_id: -1 }).toArray();
//               const paginationData = { count, data } ;
  
//               if (!paginationData) {
//                 throw new Error('Error');
//               }
//               return paginationData
//             }
//           },
//         }}}) ;