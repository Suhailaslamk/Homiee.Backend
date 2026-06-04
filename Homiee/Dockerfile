FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore Homiee/Homiee.csproj
RUN dotnet publish Homiee/Homiee.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Homiee.dll"]