import { app } from './app.js';
import { sequelize } from './config/database.js';
const PORT = process.env.PORT || 3000;

try {
    await sequelize.authenticate();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}/api`);
    });
} catch (error) {
    console.error('Unable to connect to the database:', error);
}
