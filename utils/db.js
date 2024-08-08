import mongoose from "mongoose";

export default function connectDB() {
    mongoose.connect("mongodb+srv://guest:guest@cluster0.wji5iwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
      .then(() => console.log("Connected to Databse"))
      .catch(err => console.log(err));
}