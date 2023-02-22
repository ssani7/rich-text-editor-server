const mongoose = require("mongoose")
require('dotenv').config();

const Document = require("./Document")
const port = process.env.PORT || 3001

mongoose.set("strictQuery", false);
mongoose.connect(process.env.DB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("DB Connected"))


const io = require("socket.io")(port, {
    cors: {
        origins: "*",
        methods: ["GET", "POST"]
    }
})

io.on("connection", socket => {
    socket.on("get-document", async documentID => {
        try {
            const document = await findOrCreateDocument(documentID)
            socket.join(documentID)
            socket.emit("load-document", document.data)

            socket.on("send-changes", (delta) => {
                socket.broadcast.to(documentID).emit("recieve-changes", delta)
            })

            socket.on("save-document", async data => {
                await Document.findByIdAndUpdate(documentID, { data })
            })
        } catch (error) {

        }

    })


})

async function findOrCreateDocument(id) {
    try {
        if (!id) return

        const document = await Document.findById(id);
        if (document) return document
        return await Document.create({ _id: id, data: "" })
    } catch (error) {
        return
    }

}