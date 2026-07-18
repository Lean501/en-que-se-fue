using PaymentManagement.Business.DTOs;

namespace PaymentManagement.Business.Interfaces;

public interface IAuthBusiness
{
    LoginResponseDto? Login(LoginRequestDto request);
    LoginResponseDto? Register(RegisterRequestDto request);
    LoginResponseDto? GetCurrentUser(string email);
    LoginResponseDto? UpdateProfile(string email, UpdateProfileRequestDto request);
    bool UpdatePassword(string email, UpdatePasswordRequestDto request);
}
