namespace Homiee.Presentation.Hubs
{
    
        public class ConnectionManager
        {
            private static readonly Lazy<ConnectionManager> _instance =
                new(() => new ConnectionManager());

            public static ConnectionManager Instance => _instance.Value;

            private readonly Dictionary<int, string> _connections = new();

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
                return _connections.ContainsKey(userId)
                    ? _connections[userId]
                    : null;
            }
        }
    
}
