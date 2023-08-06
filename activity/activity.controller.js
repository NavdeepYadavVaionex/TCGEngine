// MODELS / TOOLS
const Activity = require("./activity.model");

exports.GetAllActivities = async (req, res) => {
  
  let activityRequest;
  if (req.body.type) {
    activityRequest = { type: req.body.type };
  } else if (req.body.email) {
    activityRequest = { email: req.body.email };
  }
  else {
    activityRequest = { };
  }

  const a = await Activity.Get(activityRequest);
  if (!a) return res.status(500).send({ error: "Failed!!" });

  return res.status(200).send(a);
};

