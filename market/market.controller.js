const UserModel = require('../users/users.model');
const MarketModel = require('./market.model');
const UserTool = require('../users/users.tool');
const DateTool = require('../tools/date.tool');
const Activity = require("../activity/activity.model");
const config = require('../config');

exports.addOffer = async(req, res) => {

    var email = req.jwt.email;
    var card_tid = req.body.card;
    var quantity = req.body.quantity;
    var price = req.body.price;

    //Validate params
    if (!email || !card_tid || !quantity || !price)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof email !== "string"|| typeof quantity !== "number" || typeof price !== "number" || typeof card_tid !== "string" )
        return res.status(400).send({ error: "Invalid parameters" });

    if(!Number.isInteger(quantity) || !Number.isInteger(price) || price <= 0 || quantity <= 0)
        return res.status(400).send({ error: "Invalid parameters" });

    //Get user
    var user = await UserModel.getByEmail(email);
    if (!user)
        return res.status(404).send({ error: "Can't find user " + email });

    if(!UserTool.hasCard(user, card_tid, quantity))
        return res.status(400).send({ error: "You don't have those cards!" });

    //Offer
    var offer = {
        seller: email,
        card: card_tid,
        quantity: quantity,
        price: price,
    }    

    //Remove card from user
    var removeCards = [{tid: card_tid, quantity: -quantity}];
    var addSucc = UserTool.addCards(user, removeCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error removing cards from user " + email });

    //Update database
    var uOffer = await MarketModel.add(email, card_tid, offer);
    var uUser = await UserModel.update(user, { cards: user.cards, });

    if(!uUser || !uOffer)
        return res.status(500).send({ error: "Error creating market offer " + email });

    //Activity
    //const act = await Activity.LogActivity("market_add", req.jwt.username, uOffer.toObj());
    //if (!act) return res.status(500).send({ error: "Failed to log activity!" });
        
    return res.status(200).send(uOffer.toObj());
};

exports.removeOffer = async(req, res) => {

    var email = req.jwt.email;
    var card_tid = req.body.card;

    //Validate params
    if (!email || !card_tid)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof email !== "string"|| typeof card_tid !== "string" )
        return res.status(400).send({ error: "Invalid parameters" });

    var user = await UserModel.getByEmail(email);
    if (!user)
        return res.status(404).send({ error: "Can't find user " + email });

    var offer = await MarketModel.getOffer(email, card_tid)
    if (!offer)
        return res.status(404).send({ error: "No market offer for " + email + "-" + card_tid });

    //Add cards user
    var addCards = [{tid: card_tid, quantity: offer.quantity}];
    var addSucc = UserTool.addCards(user, addCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error adding cards to user " + email });

    //Update database
    var uUser = await UserModel.update(user, { cards: user.cards });
    var uOffer = await MarketModel.remove(email, card_tid);

    if(!uUser || !uOffer)
        return res.status(500).send({ error: "Error removing market offer " + email });

    //Activity
    //const act = await Activity.LogActivity("market_remove", req.jwt.username, {});
    //if (!act) return res.status(500).send({ error: "Failed to log activity!" });
        
    return res.status(200).send({success: uOffer});
};

exports.trade = async(req, res) => {

    var email = req.jwt.email;
    var seller_Email = req.body.seller;
    var card_tid = req.body.card;
    var quantity = req.body.quantity;

    //Validate params
    if (!email || !seller_Email || !card_tid || !quantity)
        return res.status(400).send({ error: "Invalid parameters" });

    if(typeof seller_Email !== "string" || typeof card_tid !== "string" || typeof quantity !== "number")
        return res.status(400).send({ error: "Invalid parameters" });

    if(!Number.isInteger(quantity) || quantity <= 0)
        return res.status(400).send({ error: "Invalid parameters" });

    //Get user
    var user = await UserModel.getByEmail(email);
    var seller = await UserModel.getByEmail(seller_Email);
    if (!user || !seller)
        return res.status(404).send({ error: "Can't find user " + email + " or " + seller_Email });

    if(user.email == seller.email)
        return res.status(403).send({ error: "Can't trade with yourself!" });

    //Get offer
    var offer = await MarketModel.getOffer(seller_Email, card_tid)
    if (!offer)
        return res.status(404).send({ error: "No market offer for " + seller_Email + "-" + card_tid });

    var value = quantity * offer.price;
    if(user.coins < value)
        return res.status(403).send({ error: "Not enough coins to trade!" });
    if(quantity > offer.quantity)
        return res.status(403).send({ error: "Not enough cards to trade!" });
    
    //Add cards and coins
    var addCards = [{tid: card_tid, quantity: quantity}];
    var addSucc = UserTool.addCards(user, addCards);
    if(!addSucc)
        return res.status(500).send({ error: "Error adding cards to user " + email });
        
    user.coins -= value;
    seller.coins += value;

    //Update database
    var uUser = await UserModel.update(user, { coins: user.coins, cards: user.cards });
    var uSeller = await UserModel.update(seller, { coins: seller.coins });
    var uOffer = await MarketModel.reduce(seller_user, card_tid, quantity);
    if(!uUser || !uOffer || !uSeller)
        return res.status(500).send({ error: "Error trading market offer " + email + " " + seller_Email });

    //Activity
    var aData = {buyer: email, seller: seller_Email, card: card_tid, quantity: quantity, price: offer.price };
    const act = await Activity.LogActivity("market_trade", req.jwt.email, aData);
    if (!act) return res.status(500).send({ error: "Failed to log activity!" });

    return res.status(200).send(aData);
};

exports.getBySeller = async(req, res) => {

    if(!req.params.email)
        return res.status(400).send({ error: "Invalid parameters" });

    var list = await MarketModel.getBySeller(req.params.email);
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};

exports.getByCard = async(req, res) => {

    if(!req.params.tid)
        return res.status(400).send({ error: "Invalid parameters" });

    var list = await MarketModel.getByCard(req.params.tid);
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};

exports.getOffer = async(req, res) => {

    if(!req.params.tid || !req.params.email)
        return res.status(400).send({ error: "Invalid parameters" });

    var offer = await MarketModel.getOffer(req.params.email, req.params.tid);
    if(!offer)
        return res.status(404).send({ error: "Offer not found" });

    return res.status(200).send(offer.toObj());
};

exports.getAll = async(req, res) => {
    var list = await MarketModel.getAll();
    for(var i=0; i<list.length; i++){
        list[i] = list[i].toObj();
    }
    return res.status(200).send(list);
};
