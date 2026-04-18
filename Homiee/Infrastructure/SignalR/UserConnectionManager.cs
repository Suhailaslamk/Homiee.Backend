namespace Homiee.Infrastructure.SignalR
{
    public class UserConnectionManager
    {
        private static readonly Dictionary<int, string> _connections = new();

        public void AddConnection(int userId, string connectionId)
        {
            _connections[userId] = connectionId;
        }

        public void RemoveConnection(int userId)
        {
            if (_connections.ContainsKey(userId))
                _connections.Remove(userId);
        }

        public string? GetConnection(int userId)
        {
            return _connections.TryGetValue(userId, out var conn) ? conn : null;
        }
    }
}
