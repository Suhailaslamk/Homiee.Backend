using System.Data;

namespace Homiee.Shared.Applications.IData;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
