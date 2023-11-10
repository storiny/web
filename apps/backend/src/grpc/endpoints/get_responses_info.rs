use crate::grpc::{
    defs::response_def::v1::{GetResponsesInfoRequest, GetResponsesInfoResponse},
    service::GrpcService,
};
use tonic::{Request, Response, Status};

pub async fn get_responses_info(
    client: &GrpcService,
    request: Request<GetResponsesInfoRequest>,
) -> Result<Response<GetResponsesInfoResponse>, Status> {
    Ok(Response::new(GetResponsesInfoResponse {
        comment_count: 10,
        reply_count: 90,
    }))
}
