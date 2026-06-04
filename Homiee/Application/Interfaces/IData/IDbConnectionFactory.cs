using System.Data;

namespace Homiee.Application.Interfaces.IData;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
