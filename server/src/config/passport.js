const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../auth/models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
        ? `${process.env.SERVER_URL || 'https://your-server-name.onrender.com'}/auth/google/callback`
        : 'http://localhost:3001/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 기존 사용자 확인
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // 기존 사용자라면 마지막 로그인 시간 업데이트
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }
        
        // 새 사용자 생성
        user = new User({
            googleId: profile.id,
            name: profile.displayName,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0] ? profile.photos[0].value : null,
            points: 0,
            recycleCount: 0,
            reportCount: 0
        });
        
        await user.save();
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

module.exports = passport; 