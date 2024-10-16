const router = require("express").Router();
const Message = require("../model/Message");

//add

router.post("/", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    const savedMessage = await newMessage.save();
    if (savedMessage) {
      res.status(200).json(savedMessage);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});



//get
router.get("/:conversationId", async (req, res) => {
  try {
   const getmessges= await Message.find({
    conversationId:req.params.conversationId
   })

    if (getmessges) {
      res.status(200).json(getmessges);
    }
  } catch (error) {
    res.status(500).json(error)
  }
});

module.exports = router;
