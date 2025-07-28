import { app } from "./app";


const PORT = process.env.PORT || 3200;

app.listen(PORT, () =>{
    console.log(`API sucessfully started at port ${PORT}`);
})