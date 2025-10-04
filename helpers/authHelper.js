import bcrypt from "bcrypt";

/**
 * Hashes password 
 * @param {string} password 
 * @returns {string} hashedPassword
 * @throws {Error} Will throw error if hashing is not successful
 */
export const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;

    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Compare password with the hashed correct password 
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {boolean} if they match
 */
export const comparePassword = async (password,hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
}