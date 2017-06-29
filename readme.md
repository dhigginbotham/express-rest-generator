# express-rest-generator
Generates RESTful endpoints based on Mongoose schemas.  Does things as you'd expect, `GET` requests are treated as a `collection.find()` query, if an `:id` param is provided to the end point -- it will do a `collection.findById()`. `POST`, `PUT`, `PATCH` http methods will either insert or update a document, depending if an `:id` param is provided to the end point.  `DELETE` http method is self descriptive.

