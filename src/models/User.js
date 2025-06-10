const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        console.log('Pre-save hook triggered for user:', this.email);
        console.log('Raw password before hashing:', this.password);
        
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) {
            console.log('Password not modified, skipping hash');
            return next();
        }

        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (this.password.startsWith('$2b$')) {
            console.log('Password is already hashed, skipping hash');
            return next();
        }

        console.log('Generating salt for password hash');
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated:', salt);
        
        console.log('Hashing password with salt');
        // Hash the password along with our new salt
        const hashedPassword = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully. Hash:', hashedPassword);
        
        // Override the cleartext password with the hashed one
        this.password = hashedPassword;
        console.log('Password updated in user object');
        
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Comparing passwords for user:', this.email);
        console.log('Candidate password:', candidatePassword);
        console.log('Stored password hash:', this.password);
        
        // Compare the candidate password with the stored hash
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password comparison result:', isMatch);
        
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw error;
    }
};

// Method to check if password needs to be rehashed
userSchema.methods.checkPasswordRehash = async function() {
    try {
        // Check if the password needs to be rehashed
        const needsRehash = await bcrypt.getRounds(this.password) !== 10;
        if (needsRehash) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            await this.save();
        }
    } catch (error) {
        console.error('Error checking password rehash:', error);
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 