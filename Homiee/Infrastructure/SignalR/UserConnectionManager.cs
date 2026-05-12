namespace Homiee.Infrastructure.SignalR
{
    public class UserConnectionManager
    {
        // ❌ Was: private static readonly Dictionary — static is WRONG with DI singleton
        private readonly Dictionary<int, HashSet<string>> _connections = new();
        private readonly object _lock = new();

        // Store ALL connections per user (user can connect from multiple tabs/devices)
        public void AddConnection(int userId, string connectionId)
        {
            lock (_lock)
            {
                if (!_connections.ContainsKey(userId))
                    _connections[userId] = new HashSet<string>();
                _connections[userId].Add(connectionId);
            }
        }

        public void RemoveConnection(int userId, string connectionId)
        {
            lock (_lock)
            {
                if (_connections.TryGetValue(userId, out var conns))
                {
                    conns.Remove(connectionId);
                    if (conns.Count == 0)
                        _connections.Remove(userId);
                }
            }
        }

        public IEnumerable<string> GetConnections(int userId)
        {
            lock (_lock)
                return _connections.TryGetValue(userId, out var conns)
                    ? conns.ToList()
                    : Enumerable.Empty<string>();
        }

        public bool IsOnline(int userId)
        {
            lock (_lock)
                return _connections.ContainsKey(userId);
        }

        public object GetAllConnections()
        {
            lock (_lock)
            {
                return _connections.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.ToList()
                );
            }
        }
    }
}