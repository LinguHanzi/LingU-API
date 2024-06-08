const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const InputError = require('../exceptions/InputError');

const db = new Firestore();

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('Hashing error:', error);
        throw error;
    }
}

async function registerUser(email, password, fullName) {
    try {
        const hashedPassword = await hashPassword(password);
        const uid = uuidv4();
        const userData = {
            uid: uid,
            email: email,
            fullName: fullName,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        const userCollection = db.collection('users');
        await userCollection.doc(uid).set(userData);

        return { uid: uid, email: email, fullName: fullName };
    } catch (error) {
        throw new InputError(error.message);
    }
}

async function loginUser(email, password) {
    try {
        const userCollection = db.collection('users');
        const snapshot = await userCollection.where('email', '==', email).get();
        if (snapshot.empty) {
            throw new Error('Invalid email or password');
        }

        let userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const passwordIsValid = await bcrypt.compare(password, userData.password);

        if (!passwordIsValid) {
            throw new Error('Invalid email or password');
        }

        return { uid: userData.uid, email: userData.email, fullName: userData.fullName };
    } catch (error) {
        throw new InputError('Invalid email or password');
    }
}

module.exports = { registerUser, loginUser };
