const UserModel = require("./users.model");
const Activity = require("../activity/activity.model");
const UserTool = require('./users.tool');
const config = require('../config.js');

exports.AddFriend = async (req, res) => {

  const email = req.jwt.email;
  const friendEmail = req.body.email;

  //Validate params
  if (!friendEmail || !email) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getByEmail(email);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  const friend = await UserModel.getByEmail(friendEmail);
  if (!friend)
    return res.status(404).send({ error: "Can't find friend" });

  if(user.email == friend.email)
    return res.status(400).send({ error: "Can't add yourself" });

  //Add Friend
  if(!user.friends.includes(friend.email))
    user.friends.push(friend.email);

  //Add request other friend
  if(!friend.friends.includes(user.email) && !friend.friends_requests.includes(user.email))
    friend.friends_requests.push(user.email)

  //Remove self request
  if(user.friends_requests.includes(friend.email))
    user.friends_requests.remove(friend.email);

  //Update the user array
  var updatedUser = await UserModel.save(user, ["friends", "friends_requests"]);
  if (!updatedUser) return res.status(400).send({ error: "Error updating user" });

  //Update the other user
  var updatedFriend = await UserModel.save(friend, ["friends_requests"]);
  if (!updatedFriend) return res.status(400).send({ error: "Error updating user" });

  // -------------
  return res.status(200).send(updatedUser.deleteSecrets());
};

exports.RemoveFriend = async(req, res) => {

  const email = req.jwt.email;
  const friendEmail = req.body.email;

  //Validate params
  if (!email || !friendEmail) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getByEmail(email);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  const friend = await UserModel.getByEmail(friendEmail);
  if (!friend)
    return res.status(404).send({ error: "Can't find friend" });

  if(user.friends.includes(friend.email))
    user.friends.remove(friend.email);
  if(user.friends_requests.includes(friend.email))
    user.friends_requests.remove(friend.email);
  if(friend.friends_requests.includes(user.email))
    friend.friends_requests.remove(user.email)

  //Update the user array
  var updatedUser = await UserModel.save(user, ["friends", "friends_requests"]);
  if (!updatedUser) return res.status(400).send({ error: "Error updating user" });

  var updatedFriend = await UserModel.save(friend, ["friends_requests"]);
  if (!updatedFriend) return res.status(400).send({ error: "Error updating user" });

  // -------------
  return res.status(200).send(updatedUser.deleteSecrets());
};

exports.ListFriends = async(req, res) => 
{
  const email = req.jwt.email;

  //Validate params
  if (!email) {
    return res.status(400).send({ error: "Invalid parameters" });
  }

  //Get the user
  const user = await UserModel.getByEmail(email);
  if (!user)
    return res.status(404).send({ error: "Can't find user" });

  var friends_users = user.friends || [];
  var requests_users = user.friends_requests || [];

  const friends = await UserModel.listByEmail(friends_users);
  if (!friends)
    return res.status(404).send({ error: "Can't find user friends" });

  const requests = await UserModel.listByEmail(requests_users);
  if (!requests)
    return res.status(404).send({ error: "Can't find user friends" });

  //Reduce visible fields
  for(var i=0; i<friends.length; i++)
  {
    friends[i] = {
      email: friends[i].email,
      avatar: friends[i].avatar,
      last_login_time: friends[i].last_login_time,
    }
  }

  for(var i=0; i<requests.length; i++)
  {
    requests[i] = {
      email: requests[i].email,
      avatar: requests[i].avatar,
      last_login_time: requests[i].last_login_time,
    }
  }

  return res.status(200).send({email: user.email, friends: friends, friends_requests: requests, server_time: new Date()});
  
}
