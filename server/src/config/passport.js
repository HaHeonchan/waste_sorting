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

// Google OAuth 설정 로깅
console.log('🔧 Google OAuth 설정:', {
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '설정됨' : '설정되지 않음',
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    callbackURL: process.env.NODE_ENV === 'production' 
        ? `${process.env.REACT_APP_API_URL}/auth/google/callback`
        : "http://localhost:3001/auth/google/callback"
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback" // 상대 경로 사용
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