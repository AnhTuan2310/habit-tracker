namespace Application.DTOs.Common;

public class BaseResponseDTO<T>
{
    public int Code { get; set; } = 200;
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
    public T? Data { get; set; }

    public static BaseResponseDTO<T> SuccessResponse(T data, string? message = null, int code = 200)
        => new() { Data = data, Message = message, Code = code, Success = true };

    public static BaseResponseDTO<T> FailResponse(string message, int code = 500)
        => new() { Message = message, Code = code, Success = false };
}
