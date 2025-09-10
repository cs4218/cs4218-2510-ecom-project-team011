import { testController } from './authController.js';

describe('AuthController', () => {
  describe('testController', () => {
    it('should return "Protected Routes" message', () => {
      // Mock request and response objects
      const mockReq = {};
      const mockRes = {
        send: jest.fn()
      };

      // Call the testController function
      testController(mockReq, mockRes);

      // Assert that the response was called with the expected message
      expect(mockRes.send).toHaveBeenCalledWith('Protected Routes');
    });
  });
});
