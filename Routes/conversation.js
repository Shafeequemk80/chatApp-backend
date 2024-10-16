const router = require("express").Router();
const e = require("express");
const Conversation = require("../model/Conversation"); // Ensure the path is correct


router.post("/", async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ message: "Sender ID and Receiver ID are required" });
  }

  const newConversation = new Conversation({
    members: [senderId, receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    if(savedConversation){

      res.status(201).json(savedConversation); // 201 Created
    }
  } catch (error) {
    console.error("Error saving conversation:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/:userId", async (req, res) => {
try {
    const { userId } = req.params;
    const conversation = await Conversation.find({
      members: { $in: [userId] }
    });
    
    if(conversation){
  
      res.status(200).json(conversation)
    }
} catch (error) {
    res.status(500).json(error)
}
});

module.exports = router;
