# 🌍 World Cup Sweepstakes

A full-stack web application that allows users to create and join private leagues, draw random World Cup teams, and compete on a shared leaderboard.
I wanted to create a sweepstakes where everyone has a chance.
Many sweepstakes over the years has ended up with me drawing a team with a slim chance. 
This gives everyone a chance, drawing teams from four pools. This ensures uniqueness whilst giving everyone one of the favourites also.
Before you ask the rest of this README was infact written by AI

---

## 🚀 Overview

World Cup Sweepstakes is a multiplayer web app where users can:

- Create private leagues with a name and password  
- Join leagues using a shared password  
- Randomly draw teams from multiple pools  
- Compete against others in a shared leaderboard  
- Track performance based on match results and scoring rules  

The app turns a football tournament into an **interactive sweepstakes competition**.

---

## 🎮 How It Works

1. **Enter Your Name**  
   Users begin by entering their name.

2. **Create or Join a League**
   - Create a league using:
     - League name  
     - Unique password  
   - Or join an existing league using its password  

3. **Draw Teams**
   - Each user spins once  
   - One team is drawn from each pool  
   - Team combinations are unique within each league  

4. **Leaderboard**
   - All players are ranked in one shared table  
   - Scores are calculated based on match results  

5. **Admin Page**
   - Accessible via a hidden route  
   - Allows entry of match results  
   - Automatically updates scores  

---

## 🧮 Scoring System

Points are awarded based on:

- Goals scored  
- Progression through tournament rounds  
- Final placement  

Scoring rules are available in-app via the **Rules popup**.

---

## 🛠️ Tech Stack

### Frontend
- React (TypeScript)  
- Vite  
- Custom CSS  

### Backend / Database
- Supabase (PostgreSQL)  

Used for:
- Leagues  
- Players  
- Team selections  

---

## 🔐 Features

- ✅ Unique league passwords  
- ✅ Shared multiplayer data via Supabase  
- ✅ Duplicate team combination prevention  
- ✅ Inline error handling (no alerts)  
- ✅ Modal scoring rules popup  
- ✅ Clean and responsive UI  

---

## 📁 Project Structure