namespace Domain.Constants;

public static class MessageConstant
{
    public static class CommonMessage
    {
        public const string NOT_FOUND = "Không tìm thấy dữ liệu";
        public const string INVALID_REQUEST = "Dữ liệu gửi lên không hợp lệ";
    }

    public static class HabitMessage
    {
        public const string NAME_REQUIRED = "Tên thói quen không được để trống";
        public const string NOT_FOUND = "Không tìm thấy thói quen";
    }

    public static class SyncMessage
    {
        public const string UNKNOWN_HABIT = "Thao tác trỏ tới một thói quen không tồn tại";
        public const string DEVICE_REQUIRED = "Thiếu mã thiết bị gửi lên";
        public const string TOO_MANY_OPERATIONS = "Một lần gửi không được quá {0} thao tác";
    }
}
