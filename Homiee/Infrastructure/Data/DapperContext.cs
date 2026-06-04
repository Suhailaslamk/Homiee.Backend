using Homiee.Application.Interfaces.IData;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace Homiee.Infrastructure.Data
{
    public class DapperContext : IDbConnectionFactory
    {
        private readonly IConfiguration _config;

        public DapperContext(IConfiguration config)
        {
            _config = config;
        }

        public IDbConnection CreateConnection()
            => new SqlConnection(_config.GetConnectionString("DefaultConnection"));
    }
}
